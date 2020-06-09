// "SPDX-License-Identifier: UNLICENSED"
pragma solidity 0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdVest {

	using SafeMath for uint256;

    address payable public feeAccount; // account that will receive fees
    uint256 public traderFeePercent; // trader fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorFeePercent; // investor fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    
    mapping(address => mapping(uint256 => _Investment)) public investments; // mapping list of investments to traders

    mapping(address => _Trader) public traders;
    mapping(address => _Investor) public investors;

    mapping(uint256 => address) public traderList;
    mapping(uint256 => address) public investorList;

    uint256 public traderCount;
    uint256 public investorCount;

    event Trader(address indexed trader, uint256 traderId, uint256 investorProfitPercent);
    event Investor(address indexed investor, uint256 investorId);
    event Deposit(address indexed investor, uint256 investorId, uint256 amount, uint256 balance);
    event Withdraw(address indexed investor, uint256 investorId, uint256 amount, uint256 balance);
    event Invest(uint256 id, address indexed investor, address indexed trader, uint256 amount, uint256 balance);
    event RequestExit(address indexed trader, uint256 investmentId, uint256 date, uint256 value, uint256 investorProfit, uint256 platformFee);
    event CancelExit(address indexed trader, uint256 investmentId);
    event RejectExit(address indexed trader, uint256 investmentId);
    event ApproveExit(address indexed trader, uint256 investmentId, uint256 nettAmount);

    enum InvestmentState {
        Invested,
        ExitRequested,
        ExitRejected,
        Divested
    }

    struct _Trader {
        uint256 id;
        address payable user;
        uint256 investorProfitPercent;
        uint256 balance;
        uint256 investmentCount;
    }

    struct _Investor {
        uint256 id;
        address payable user;
        uint256 balance;
    }

    struct _Investment {
        address payable trader;
        address payable investor;
        uint256 amount;
        uint256 startDate;
        uint256 endDate;
        uint256 value;
        uint256 investorProfit;
        uint256 platformFee;
        InvestmentState state;
    }

    constructor(address payable _feeAccount, uint256 _traderFeePercent, uint256 _investorFeePercent) public {
        feeAccount = _feeAccount;
        traderFeePercent = _traderFeePercent;
        investorFeePercent = _investorFeePercent;
    }

    // reverts if ether is sent directly
    fallback() external {
        revert();
    }

    function joinAsTrader(uint256 _investorProfitPercent) public {
        require(
            _investorProfitPercent < 10000 && 
            _investorProfitPercent >= investorFeePercent);

        traderCount = traderCount.add(1);
        traderList[traderCount] = msg.sender;

        traders[msg.sender] = _Trader(
                traderCount,
                msg.sender, 
                _investorProfitPercent,
                0,
                0
            );
        

        emit Trader(msg.sender, traderCount, _investorProfitPercent);
    }

    function joinAsInvestor() public {
        investorCount = investorCount.add(1);
        investorList[investorCount] = msg.sender;
        investors[msg.sender] = _Investor(
                investorCount,
                msg.sender,
                0
            );

        emit Investor(msg.sender, investorCount);
    }

    /**
        Investor deposits money into the contract for the purposes of later investment
    */
    function deposit() public payable {
        _Investor storage _investor = investors[msg.sender];
        require(_investor.user == msg.sender);
        _investor.balance = _investor.balance.add(msg.value);
        emit Deposit(msg.sender, _investor.id, msg.value, _investor.balance);
    }

    /**
        Investor withdraws previously deposited funds, perhaps including profits (and losses)
    */
    function withdraw(uint256 _amount) public {
        _Investor storage _investor = investors[msg.sender];
        require(_investor.user == msg.sender);
        require(_investor.balance >= _amount);
        _investor.balance = _investor.balance.sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdraw(msg.sender, _investor.id, _amount, _investor.balance);
    }

    /**
        Investor allocates funds to a trader for investment
    */
    function invest(address _traderAddress, uint256 _amount) public {
        _Investor storage _investor = investors[msg.sender];
        require(_investor.user == msg.sender);

        _Trader storage _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);
        require(_investor.balance >= _amount);

        _investor.balance = _investor.balance.sub(_amount);
        _trader.balance = _trader.balance.add(_amount);
        _trader.user.transfer(_amount);

        _trader.investmentCount = _trader.investmentCount.add(1);
        investments[_trader.user][_trader.investmentCount] = _Investment(
                _trader.user,
                _investor.user,
                _amount,
                now,
                0,
                0,
                0,
                0,
                InvestmentState.Invested
            );

        emit Invest(
            _trader.investmentCount, 
            msg.sender, 
            _trader.user, 
            _amount, 
            _investor.balance
        );
    }

    /**
        Investor requests an exit, indicating the nett profit
    */
    function requestExit(address _traderAddress, uint256 _investmentId, uint256 _value) external {
        _Trader storage _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);
        require(investments[_traderAddress][_investmentId].investor == msg.sender);
        require(investments[_traderAddress][_investmentId].state == InvestmentState.Invested);

        if (_value > investments[_traderAddress][_investmentId].amount) {
            // profit
            uint256 _investorProfitPercent = _trader.investorProfitPercent.sub(investorFeePercent);
            uint256 _traderProfitPercent = uint256(10000).sub(_trader.investorProfitPercent).sub(traderFeePercent);

            uint256 _profit = _value - investments[_traderAddress][_investmentId].amount;
            uint256 _investorProfit = _profit.mul(_investorProfitPercent).div(10000);
            uint256 _traderProfit = _profit.mul(_traderProfitPercent).div(10000);
            uint256 _fee = _profit.sub(_investorProfit).sub(_traderProfit);

            investments[_traderAddress][_investmentId].investorProfit = _investorProfit;
            investments[_traderAddress][_investmentId].platformFee = _fee;

        } else if (_value <= investments[_traderAddress][_investmentId].amount) {
            // break even or loss
            investments[_traderAddress][_investmentId].investorProfit = 0;
            investments[_traderAddress][_investmentId].platformFee = 0;
        }
        
        investments[_traderAddress][_investmentId].endDate = now;
        investments[_traderAddress][_investmentId].value = _value;
        investments[_traderAddress][_investmentId].state = InvestmentState.ExitRequested;

        emit RequestExit(
            _traderAddress, 
            _investmentId, 
            investments[_traderAddress][_investmentId].endDate, 
            _value, 
            investments[_traderAddress][_investmentId].investorProfit, 
            investments[_traderAddress][_investmentId].platformFee
        );
    }

    /**
        Investor cancels an exit request
    */
    function cancelExit(address _traderAddress, uint256 _investmentId) external {
        require(investments[_traderAddress][_investmentId].investor == msg.sender);
        require(investments[_traderAddress][_investmentId].state == InvestmentState.ExitRequested);

        investments[_traderAddress][_investmentId].state = InvestmentState.Invested;

        emit CancelExit(
            _traderAddress, 
            _investmentId
        );
    }

    /**
        Trader rejects the exit request
        Perhaps the investor made a false profit claim
        This will now enter a dispute workflow managed on the client
    */
    function rejectExit(uint256 _investmentId) external {
        require(investments[msg.sender][_investmentId].trader == msg.sender);
        require(investments[msg.sender][_investmentId].state == InvestmentState.ExitRequested);
        
        investments[msg.sender][_investmentId].state = InvestmentState.ExitRejected;

        emit RejectExit(
            msg.sender, 
            _investmentId
        );
    }

    /**
        Trader approves the exit by paying the nett profit back to the contract, under the name of the investor
    */
    function approveExit(uint256 _investmentId, address _investorAddress) external payable {
        _Trader storage _trader = traders[msg.sender];
        require(_trader.user == msg.sender);
        _Investor storage _investor = investors[_investorAddress];
        require(_investor.user == _investorAddress);
        require(investments[msg.sender][_investmentId].trader == msg.sender);
        require(investments[msg.sender][_investmentId].state == InvestmentState.ExitRequested);
        require(_trader.balance >= investments[msg.sender][_investmentId].amount);
        
        uint256 _nettAmount = 0;

        if (investments[msg.sender][_investmentId].value > investments[msg.sender][_investmentId].amount) {
            // profit
            _nettAmount = investments[msg.sender][_investmentId].investorProfit.add(investments[msg.sender][_investmentId].amount);
            require(_nettAmount.add(investments[msg.sender][_investmentId].platformFee) == msg.value);

            feeAccount.transfer(investments[msg.sender][_investmentId].platformFee);

        } else if (investments[msg.sender][_investmentId].value == investments[msg.sender][_investmentId].amount) {
            // break even
            _nettAmount = investments[msg.sender][_investmentId].amount;
            require(_nettAmount == msg.value);
        } else {
            // loss
            _nettAmount = investments[msg.sender][_investmentId].amount - (investments[msg.sender][_investmentId].amount - investments[msg.sender][_investmentId].value);
            require(_nettAmount == msg.value);
        }

        investments[msg.sender][_investmentId].state = InvestmentState.Divested;
        // subtract the original invested amount from the trader balance
        _trader.balance = _trader.balance.sub(investments[msg.sender][_investmentId].amount);

        // add the nettAmount to the investor balance
        _investor.balance = _investor.balance.add(_nettAmount);

        emit ApproveExit(
            msg.sender,
            _investmentId,
            _nettAmount
        );
    }
}
