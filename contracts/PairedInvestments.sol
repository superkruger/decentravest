// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

contract PairedInvestments is Initializable, Ownable {
	using SafeMath for uint256;

    /*
     *  Storage
     */
	address public manager;

	uint8 constant IDX_ADDRESS_traderAddress 		= 0;
	uint8 constant IDX_ADDRESS_investorAddress 		= 1;

	uint8 constant IDX_UINT256_investmentId 		= 0;
	uint8 constant IDX_UINT256_value 				= 1;
    uint8 constant IDX_UINT256_amount               = 2;

	uint256 public traderFeePercent; // trader fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorFeePercent; // investor fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorProfitPercent;

	mapping(uint256 => _Investment) public investments;
    uint256 public investmentCount;

    /*
     *  Structs
     */
    enum InvestmentState {
        Invested,
        Stopped,
        ExitRequestedInvestor,
        ExitRequestedTrader,
        Divested
    }

    struct _Investment {
        uint256 id;
        address trader;
        address investor;
        address token;
        uint256 amount;
        uint256 value;
        InvestmentState state;
    }

    struct _InvestmentArgs {
    	address _traderAddress;
    	address _investorAddress; 
    	uint256 _investmentId;
    	uint256 _amount;
    }

    /*
     *  Modifiers
     */
    modifier onlyManager() {
        require(manager == msg.sender);
        _;
    }

    function initialize(
	    	uint256 _traderFeePercent, 
	        uint256 _investorFeePercent, 
	        uint256 _investorProfitPercent) 
        public 
        initializer 
    {
    	Ownable.initialize(msg.sender);
    	traderFeePercent = _traderFeePercent;
        investorFeePercent = _investorFeePercent;
        investorProfitPercent = _investorProfitPercent;
    }

    function setManager(address _manager) 
        public 
        onlyOwner 
    {
        manager = _manager;
    }

    function invest(address _traderAddress, address _investorAddress, address _token, uint256 _amount) 
        public 
        onlyManager 
        returns(uint256) 
    {
        
        investmentCount = investmentCount.add(1);
        investments[investmentCount] = _Investment({
                id: investmentCount,
                trader: _traderAddress,
                investor: _investorAddress,
                token: _token,
                amount: _amount,
                value: 0,
                state: InvestmentState.Invested
            });

        return investmentCount;
    }

    function stop(address _traderAddress, address _investorAddress, uint256 _investmentId) 
        public 
        onlyManager 
    {
        _Investment storage _investment = investments[_investmentId];

        require(_investment.trader == _traderAddress);
        require(_investment.investor == _investorAddress);
        require(_investment.state == InvestmentState.Invested);

        _investment.state = InvestmentState.Stopped;
    }

    function requestExitInvestor(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value) 
        public  
    {
        _requestExit(_traderAddress, _investorAddress, _investmentId, _value, InvestmentState.ExitRequestedInvestor);
    }

    function requestExitTrader(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value, uint256 _amount) 
        public 
    {
        _Investment memory _investment = investments[_investmentId];

        if (_value > _investment.amount) {

            (
                uint256 _traderFee,
                uint256 _investorFee,
                ,
                uint256 _investorProfit
            ) = calculateProfitsAndFees(
                _value, 
                _investment.amount, 
                traderFeePercent, 
                investorFeePercent, 
                investorProfitPercent
            );

            require(_investorProfit.add(_traderFee).add(_investorFee) == _amount);
            
        } else {

            uint256 _traderFee = (_investment.amount.sub(_value)).mul(traderFeePercent).div(10000);

            require(_traderFee == _amount);
        }

        _requestExit(_traderAddress, _investorAddress, _investmentId, _value, InvestmentState.ExitRequestedTrader);
    }

    function _requestExit(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value, InvestmentState _state) 
        internal 
        onlyManager 
    {
        _Investment storage _investment = investments[_investmentId];

        require(_investment.trader == _traderAddress);
        require(_investment.investor == _investorAddress);
        require(_investment.state == InvestmentState.Stopped);

        _investment.value = _value;
        _investment.state = _state;
    }

    function approveExit(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _amount) 
        public 
        onlyManager 
        returns (uint256[5] memory result) 
    {

        _Investment storage _investment = investments[_investmentId];
        require(_investment.trader == _traderAddress);
        require(_investment.investor == _investorAddress);
        require(_investment.state == InvestmentState.ExitRequestedInvestor || 
                _investment.state == InvestmentState.ExitRequestedTrader);

        uint256 _expected = 0;

        if (_investment.value > _investment.amount) {

        	(
            	uint256 _traderFee,
            	uint256 _investorFee,
            	,
            	uint256 _investorProfit
            ) = calculateProfitsAndFees(
            	_investment.value, 
            	_investment.amount, 
            	traderFeePercent, 
            	investorFeePercent, 
            	investorProfitPercent
            );

            // if the investor requested the exit, the trader will have to pay the amount
            // if the trader requested the exit, they've already paid the amount
            if (_investment.state == InvestmentState.ExitRequestedInvestor) {
                _expected = _investorProfit.add(_traderFee).add(_investorFee);   
            }

            require(_expected == _amount);

            // investment amount plus profit (minus fee)
            result[1] = _investment.amount.add(_investorProfit);

            // pay trader and investor fee
            result[2] = _traderFee.add(_investorFee);
            
            
        } else {

        	uint256 _traderFee = (_investment.amount.sub(_investment.value)).mul(traderFeePercent).div(10000);

            // if the investor requested the exit, the trader will have to pay the amount
            // if the trader requested the exit, they've already paid the amount
            if (_investment.state == InvestmentState.ExitRequestedInvestor) {
        	   _expected =_traderFee;
            }

            require(_expected == _amount);

            // take losses away from investor
            result[1] = _investment.value;
            
            // add losses to trader balance
            result[0] = _investment.amount.sub(_investment.value);
            
            // trader fee
            result[2] = _traderFee;
        }

        _investment.state = InvestmentState.Divested;

        result[3] = _investment.amount;
        result[4] = _expected;
    }

    function calculateProfitsAndFees(
		uint256 _value,
		uint256 _amount,
		uint256 _traderFeePercent,
		uint256 _investorFeePercent,
		uint256 _investorProfitPercent
	) public pure returns (uint256, uint256, uint256, uint256) {
		
        if (_value > _amount) {
    		uint256 _profit = _value - _amount;
            uint256 _investorProfit = _profit.mul(_investorProfitPercent.sub(_investorFeePercent)).div(10000);
            uint256 _traderProfit = _profit.mul(uint256(10000).sub(_investorProfitPercent).sub(_traderFeePercent)).div(10000);
            uint256 _fee = _profit.sub(_investorProfit).sub(_traderProfit);
            uint256 _investorFee = _fee.div(2);
            uint256 _traderFee = _fee.sub(_investorFee);

            return (_traderFee, _investorFee, _traderProfit, _investorProfit);
        }

        uint _traderFee = (_amount.sub(_value)).mul(_traderFeePercent).div(10000);
        return (_traderFee, 0, 0, 0);
	}
}