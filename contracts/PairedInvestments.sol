// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

contract PairedInvestments is Initializable, Ownable {
	using SafeMath for uint256;

	address public manager;

	uint8 constant IDX_ADDRESS_traderAddress 		= 0;
	uint8 constant IDX_ADDRESS_investorAddress 		= 1;

	uint8 constant IDX_UINT256_investmentId 		= 0;
	uint8 constant IDX_UINT256_amount 				= 1;

	uint256 public traderFeePercent; // trader fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorFeePercent; // investor fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorProfitPercent;

	mapping(uint256 => _Investment) public investments;
    uint256 public investmentCount;

    enum InvestmentState {
        Invested,
        ExitRequested,
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

    function requestExit(address[2] memory _addresses, uint256[2] memory _uint256s) 
        public 
        onlyManager 
    {

        _Investment storage _investment = investments[_uint256s[IDX_UINT256_investmentId]];

        require(_investment.trader == _addresses[IDX_ADDRESS_traderAddress]);
        require(_investment.investor == _addresses[IDX_ADDRESS_investorAddress]);

        require(_investment.state == InvestmentState.Invested);

        _investment.value = _uint256s[IDX_UINT256_amount];
        _investment.state = InvestmentState.ExitRequested;
    }

    function approveExit(address[2] memory _addresses, uint256[2] memory _uint256s) 
        public 
        onlyManager 
        returns (uint256[4] memory result) 
    {

        _Investment storage _investment = investments[_uint256s[IDX_UINT256_investmentId]];
        require(_investment.trader == _addresses[IDX_ADDRESS_traderAddress]);
        require(_investment.investor == _addresses[IDX_ADDRESS_investorAddress]);
        require(_investment.state == InvestmentState.ExitRequested);

        if (_investment.value > _investment.amount) {

        	(
            	uint256 _traderFee,
            	uint256 _investorFee,
            	,
            	uint256 _investorProfit
            ) = _calculateProfitsAndFees(
            	_investment.value, 
            	_investment.amount, 
            	traderFeePercent, 
            	investorFeePercent, 
            	investorProfitPercent
            );

            require(_investorProfit.add(_traderFee).add(_investorFee) == _uint256s[IDX_UINT256_amount]);

            // investment amount plus profit (minus fee)
            result[1] = _investment.amount.add(_investorProfit);

            // pay trader and investor fee
            result[2] = _traderFee.add(_investorFee);
            
            
        } else {

        	uint256 _traderFee = (_investment.amount.sub(_investment.value)).mul(traderFeePercent).div(10000);

        	require(_traderFee == _uint256s[IDX_UINT256_amount]);

            // take losses away from investor
            result[1] = _investment.value;
            
            // add losses to trader balance
            result[0] = _investment.amount.sub(_investment.value);
            
            // trader fee
            result[2] = _traderFee;
        }

        _investment.state = InvestmentState.Divested;

        result[3] = _investment.amount;
    }

    function _calculateProfitsAndFees(
		uint256 _value,
		uint256 _amount,
		uint256 _traderFeePercent,
		uint256 _investorFeePercent,
		uint256 _investorProfitPercent
		) internal pure returns (uint256, uint256, uint256, uint256) {
		
		uint256 _profit = _value - _amount;
        uint256 _investorProfit = _profit.mul(_investorProfitPercent.sub(_investorFeePercent)).div(10000);
        uint256 _traderProfit = _profit.mul(uint256(10000).sub(_investorProfitPercent).sub(_traderFeePercent)).div(10000);
        uint256 _fee = _profit.sub(_investorProfit).sub(_traderProfit);
        uint256 _investorFee = _fee.div(2);
        uint256 _traderFee = _fee.sub(_investorFee);

        return (_traderFee, _investorFee, _traderProfit, _investorProfit);
	}
}