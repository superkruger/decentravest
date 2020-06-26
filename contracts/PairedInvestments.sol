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
	uint8 constant IDX_UINT256_traderBalance 		= 2;
	uint8 constant IDX_UINT256_investorBalance 		= 3;
	uint8 constant IDX_UINT256_feeAccountBalance 	= 4;

	uint256 public traderFeePercent; // trader fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorFeePercent; // investor fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorProfitPercent;
    uint256 public secondsToForceExit; // number of seconds required before an exit can be forced

	mapping(uint256 => _Investment) public investments;
    uint256 public investmentCount;

    enum InvestmentState {
        Invested,
        ExitRequested,
        ExitRejected,
        Divested
    }

    struct _Investment {
        uint256 id;
        address trader;
        address investor;
        bool forced;
        address token;
        uint256 amount;
        uint256 endDate;
        uint256 value;
        InvestmentState state;
    }

    struct _InvestmentArgs {
    	address _traderAddress;
    	address _investorAddress; 
    	uint256 _investmentId;
    	uint256 _amount;
    	uint256 _traderBalance;
    	uint256 _investorBalance;
    	uint256 _feeAccountBalance;
    }

    modifier onlyManager() {
        require(manager == msg.sender);
        _;
    }

    function initialize(
	    	uint256 _traderFeePercent, 
	        uint256 _investorFeePercent, 
	        uint256 _investorProfitPercent,
	        uint256 _secondsToForceExit) public initializer {
    	Ownable.initialize(msg.sender);
    	traderFeePercent = _traderFeePercent;
        investorFeePercent = _investorFeePercent;
        investorProfitPercent = _investorProfitPercent;
        secondsToForceExit = _secondsToForceExit;
    }

    function setManager(address _manager) public onlyOwner {
        manager = _manager;
    }

    function invest(address _traderAddress, address _investorAddress, address _token, uint256 _amount) public onlyManager returns(uint256) {
        
        investmentCount = investmentCount.add(1);
        investments[investmentCount] = _Investment({
                id: investmentCount,
                trader: _traderAddress,
                investor: _investorAddress,
                forced: false,
                token: _token,
                amount: _amount,
                endDate: 0,
                value: 0,
                state: InvestmentState.Invested
            });

        return investmentCount;
    }

    function requestExit(address[2] memory _addresses, uint256[5] memory _uint256s) public onlyManager returns (uint256[4] memory) {

        _Investment storage _investment = investments[_uint256s[IDX_UINT256_investmentId]];

        require(_investment.trader == _addresses[IDX_ADDRESS_traderAddress]);
        require(_investment.investor == _addresses[IDX_ADDRESS_investorAddress]);

        if (_investment.endDate == 0) {
            require(_investment.state == InvestmentState.Invested);
        } else {
            require(_investment.state == InvestmentState.ExitRequested);
            require(!_investment.forced); // not yet forced
            require((now - _investment.endDate) >= secondsToForceExit); // can force an exit
            require(_investment.value == _uint256s[IDX_UINT256_amount]); // value is still the same

            _investment.forced = true;
        }

        if (_uint256s[IDX_UINT256_amount] > _investment.amount) {
            // profit

            (
            	,
            	uint256 _investorFee,
            	,
            	
            ) = _calculateProfitsAndFees(
            	_uint256s[IDX_UINT256_amount], 
            	_investment.amount, 
            	traderFeePercent, 
            	investorFeePercent, 
            	investorProfitPercent
            );

            if (_investment.forced) {
                // when forcing an exit with profit, the amount is immediately returned to the investor
                _uint256s[IDX_UINT256_investorBalance] = _uint256s[IDX_UINT256_investorBalance].add(_investment.amount);

                // immediately pay investor fee
                _uint256s[IDX_UINT256_feeAccountBalance] = _uint256s[IDX_UINT256_feeAccountBalance].add(_investorFee);
            }

        } else {
            // break even or loss
            uint256 _traderFee = (_investment.amount.sub(_uint256s[IDX_UINT256_amount])).mul(traderFeePercent).div(10000);

            if (_investment.forced) {
                // take losses away from investor
                _uint256s[IDX_UINT256_investorBalance] = _uint256s[IDX_UINT256_investorBalance].add(_uint256s[IDX_UINT256_amount]);

                // when forcing an exit with loss, the losses are immedately returned to the trader
                _uint256s[IDX_UINT256_traderBalance] = _uint256s[IDX_UINT256_traderBalance].add(
                    _investment.amount.sub(_uint256s[IDX_UINT256_amount]).sub(_traderFee)
                );
            }
        }

        _investment.endDate = now;
        _investment.value = _uint256s[IDX_UINT256_amount];
        _investment.state = InvestmentState.ExitRequested;

        uint256[4] memory _result = [
        	_uint256s[IDX_UINT256_traderBalance], 
        	_uint256s[IDX_UINT256_investorBalance], 
        	_uint256s[IDX_UINT256_feeAccountBalance], 
        	_investment.endDate];

        return (_result);
    }

    function rejectExit(address _traderAddress, uint256 _investmentId) public onlyManager {
        _Investment storage _investment = investments[_investmentId];
        require(_investment.trader == _traderAddress);
        require(_investment.state == InvestmentState.ExitRequested);
        
        _investment.state = InvestmentState.ExitRejected;
    }

    function approveExit(address[2] memory _addresses, uint256[5] memory _uint256s) public onlyManager returns (uint256[4] memory) {

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

            require(_investorProfit.add(_traderFee) == _uint256s[IDX_UINT256_amount]);

            if (_investment.forced) {
                // investment profit (minus fee)
                _uint256s[IDX_UINT256_investorBalance] = _uint256s[IDX_UINT256_investorBalance].add(_investorProfit);

                // pay trader fee
                _uint256s[IDX_UINT256_feeAccountBalance] = _uint256s[IDX_UINT256_feeAccountBalance].add(_traderFee);

            } else {
                // investment amount plus profit (minus fee)
                _uint256s[IDX_UINT256_investorBalance] = _uint256s[IDX_UINT256_investorBalance].add(
                    _investment.amount.add(_investorProfit)
                );

                // pay trader and investor fee
                _uint256s[IDX_UINT256_feeAccountBalance] = _uint256s[IDX_UINT256_feeAccountBalance]
                    .add(_traderFee)
                    .add(_investorFee);
            }
            
        } else {

        	uint256 _traderFee = (_investment.amount.sub(_investment.value)).mul(traderFeePercent).div(10000);

        	require(
                _traderFee == _uint256s[IDX_UINT256_amount]
            );

            if (!_investment.forced) {
            	
                // take losses away from investor
                _uint256s[IDX_UINT256_investorBalance] = _uint256s[IDX_UINT256_investorBalance].add(_investment.value);
                
                // add losses to trader balance
                _uint256s[IDX_UINT256_traderBalance] = _uint256s[IDX_UINT256_traderBalance]
                    .add(_investment.amount
                        .sub(_investment.value)
                        .sub(_traderFee)
                    );
            }

            // trader fee
           _uint256s[IDX_UINT256_feeAccountBalance] = _uint256s[IDX_UINT256_feeAccountBalance].add(_traderFee);
        }

        _investment.state = InvestmentState.Divested;

        uint256[4] memory _result = [
        	_uint256s[IDX_UINT256_traderBalance], 
        	_uint256s[IDX_UINT256_investorBalance], 
        	_uint256s[IDX_UINT256_feeAccountBalance], 
        	_investment.amount];

        return (_result);
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