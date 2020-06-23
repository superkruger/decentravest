// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

contract TraderPaired is Pausable {
    

	using SafeMath for uint256;

    bool private initialized;

    address constant ETHER = address(0); // allows storage of ether in blank address in token mapping
    address public feeAccount; // account that will receive fees
    uint256 public traderFeePercent; // trader fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    uint256 public investorFeePercent; // investor fee percentage in unit of 100, i.e. 100 == 1% and 5 == 0.05% and 10000 == 100%
    
    mapping(uint256 => _Investment) public investments;
    uint256 public investmentCount;

    mapping(address => mapping(uint256 => uint256)) public traderInvestments;
    mapping(address => mapping(uint256 => uint256)) public investorInvestments;
    mapping(address => mapping(address => _Allocation)) public allocations;

    mapping(address => mapping(address => uint256)) public balances; // mapping of token balances to addresses

    mapping(address => _Trader) public traders;
    mapping(address => _Investor) public investors;

    uint256 public traderCount;
    uint256 public investorCount;

    mapping(uint256 => address) public traderList;
    mapping(uint256 => address) public investorList;

    event Trader(address indexed trader, uint256 traderId, uint256 investorProfitPercent);
    event Investor(address indexed investor, uint256 investorId);
    event Allocate(address indexed trader, address token, uint256 amount);
    event Withdraw(address indexed token, address indexed user, uint256 amount, uint256 balance);
    event Invest(uint256 id, address indexed investor, address indexed trader, address indexed token, uint256 amount);
    event RequestExit(address indexed trader, uint256 investmentId, uint256 date, uint256 value, uint256 traderProfit, uint256 investorProfit, uint256 traderFee, uint256 investorFee);
    event RejectExit(address indexed trader, uint256 investmentId, uint256 value);
    event ApproveExit(address indexed trader, uint256 investmentId, uint256 traderAmount, uint256 investorAmount);

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
        uint256 investmentCount;
    }

    struct _Allocation {
        uint256 total;
        uint256 invested;
    }

    struct _Investor {
        uint256 id;
        address payable user;
        uint256 investmentCount;
    }

    struct _Investment {
        uint256 id;
        address payable trader;
        address payable investor;
        address token;
        uint256 amount;
        uint256 startDate;
        uint256 endDate;
        uint256 value;
        uint256 traderProfit;
        uint256 investorProfit;
        uint256 traderFee;
        uint256 investorFee;
        InvestmentState state;
    }

    function initialize(address payable _feeAccount, uint256 _traderFeePercent, uint256 _investorFeePercent) public {
        require(!initialized);
        initialized = true;

        feeAccount = _feeAccount;
        traderFeePercent = _traderFeePercent;
        investorFeePercent = _investorFeePercent;
    }

    // reverts if ether is sent directly
    function () external {
        revert();
    }

    function joinAsTrader(uint256 _investorProfitPercent) external whenNotPaused {
        require(traders[msg.sender].user == address(0), "Already registered as trader");
        require(investors[msg.sender].user == address(0), "Already registered as investor");

        require(
            _investorProfitPercent < 10000 && 
            _investorProfitPercent >= investorFeePercent);

        traderCount = traderCount.add(1);
        traderList[traderCount] = msg.sender;

        traders[msg.sender] = _Trader({
            id: traderCount, 
            user: msg.sender, 
            investorProfitPercent: _investorProfitPercent, 
            investmentCount: 0
        });
        

        emit Trader(msg.sender, traderCount, _investorProfitPercent);
    }

    function joinAsInvestor() external whenNotPaused {
        require(traders[msg.sender].user == address(0), "Already registered as trader");
        require(investors[msg.sender].user == address(0), "Already registered as investor");

        investorCount = investorCount.add(1);
        investorList[investorCount] = msg.sender;
        investors[msg.sender] = _Investor({
                id: investorCount,
                user: msg.sender,
                investmentCount: 0
            });

        emit Investor(msg.sender, investorCount);
    }

    function allocate(address _token, uint256 _amount) external whenNotPaused {
        _Trader memory _trader = traders[msg.sender];
        require(_trader.user == msg.sender);
        require(allocations[msg.sender][_token].total == 0);

        allocations[msg.sender][_token] = _Allocation({
                total: _amount,
                invested: 0
            });

        emit Allocate(msg.sender, _token, _amount);
    }

    /**
        Investor invests
    */
    function investEther(address _traderAddress) external payable whenNotPaused {
        _invest(_traderAddress, ETHER, msg.value);
    }

    /**
        Investor invests
    */
    function investToken(address _traderAddress, address _token, uint256 _amount) external whenNotPaused {
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        //require(IERC20(_token).transfer(address(this), _amount));
        _invest(_traderAddress, _token, _amount);
    }

    function _invest(address _traderAddress, address _token, uint256 _amount) internal {
        _Investor storage _investor = investors[msg.sender];
        require(_investor.user == msg.sender);

        _Trader storage _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);

        // falls within trader allocations
        require(allocations[_trader.user][_token].total - allocations[_trader.user][_token].invested >= _amount);

        allocations[_trader.user][_token].invested = allocations[_trader.user][_token].invested.add(_amount);
        
        investmentCount = investmentCount.add(1);
        investments[investmentCount] = _Investment({
                id: investmentCount,
                trader: _trader.user,
                investor: _investor.user,
                token: _token,
                amount: _amount,
                startDate: now,
                endDate: 0,
                value: 0,
                traderProfit: 0,
                investorProfit: 0,
                traderFee: 0,
                investorFee: 0,
                state: InvestmentState.Invested
            });

        _trader.investmentCount = _trader.investmentCount.add(1);
        traderInvestments[_trader.user][_trader.investmentCount] = investmentCount;

        _investor.investmentCount = _investor.investmentCount.add(1);
        investorInvestments[_investor.user][_investor.investmentCount] = investmentCount;

        emit Invest(
            investmentCount,
            msg.sender,
            _trader.user,
            _token,
            _amount
        );
    }

    /**
        Investor exits an investment
    */
    function requestExit(address _traderAddress, uint256 _investmentId, uint256 _value) external whenNotPaused {
        _Trader storage _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);
        require(investments[_investmentId].investor == msg.sender);
        require(investments[_investmentId].trader == _traderAddress);
        require(investments[_investmentId].state == InvestmentState.Invested);

        if (_value > investments[_investmentId].amount) {
            // profit
            uint256 _investorProfitPercent = _trader.investorProfitPercent.sub(investorFeePercent);
            uint256 _traderProfitPercent = uint256(10000).sub(_trader.investorProfitPercent).sub(traderFeePercent);

            uint256 _profit = _value - investments[_investmentId].amount;
            uint256 _investorProfit = _profit.mul(_investorProfitPercent).div(10000);
            uint256 _traderProfit = _profit.mul(_traderProfitPercent).div(10000);
            uint256 _fee = _profit.sub(_investorProfit).sub(_traderProfit);
            uint256 _investorFee = _fee.div(2);
            uint256 _traderFee = _fee.sub(_investorFee);

            investments[_investmentId].traderProfit = _traderProfit;
            investments[_investmentId].investorProfit = _investorProfit;
            investments[_investmentId].traderFee = _traderFee;
            investments[_investmentId].investorFee = _investorFee;

        } else {
            // break even or loss
            investments[_investmentId].traderProfit = 0;
            investments[_investmentId].investorProfit = 0;
            investments[_investmentId].traderFee = (investments[_investmentId].amount.sub(_value)).mul(traderFeePercent).div(10000);
            investments[_investmentId].investorFee = 0;
        }

        investments[_investmentId].endDate = now;
        investments[_investmentId].value = _value;
        investments[_investmentId].state = InvestmentState.ExitRequested;

        emit RequestExit(
            _traderAddress, 
            _investmentId, 
            investments[_investmentId].endDate, 
            _value, 
            investments[_investmentId].traderProfit, 
            investments[_investmentId].investorProfit, 
            investments[_investmentId].traderFee,
            investments[_investmentId].investorFee
        );
    }

    /**
        Trader rejects the exit request
        Perhaps the investor made a false profit claim
        This will now enter a dispute workflow managed on the client
    */
    function rejectExit(uint256 _investmentId, uint256 _value) external whenNotPaused {
        require(investments[_investmentId].trader == msg.sender);
        require(investments[_investmentId].state == InvestmentState.ExitRequested);
        
        investments[_investmentId].state = InvestmentState.ExitRejected;

        emit RejectExit(
            msg.sender, 
            _investmentId,
            _value
        );
    }

    /**
        Trader approves the exit by paying the nett profit back to the contract, under the name of the investor
    */
    function approveExitEther(uint256 _investmentId, address _investorAddress) external payable whenNotPaused {
        approveExit(_investmentId, _investorAddress, ETHER, msg.value);
    }

    /**
        Trader approves the exit by paying the nett profit back to the contract, under the name of the investor
    */
    function approveExitToken(uint256 _investmentId, address _investorAddress, address _token, uint256 _amount) external whenNotPaused {
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        approveExit(_investmentId, _investorAddress, _token, _amount);
    }

    function approveExit(uint256 _investmentId, address _investorAddress, address _token, uint256 _amount) internal {
        _Trader storage _trader = traders[msg.sender];
        require(_trader.user == msg.sender);
        _Investor storage _investor = investors[_investorAddress];
        require(_investor.user == _investorAddress);
        require(investments[_investmentId].trader == msg.sender);
        require(investments[_investmentId].state == InvestmentState.ExitRequested);

        require(
                investments[_investmentId].investorProfit
                .add(investments[_investmentId].traderFee) == _amount
            );

        if (investments[_investmentId].value > investments[_investmentId].amount) {
            // investment amount plus profit (minus fee)
            balances[_investorAddress][_token] = balances[_investorAddress][_token].add(
                investments[_investmentId].amount.add(
                    investments[_investmentId].investorProfit
                )
            );
            
            // fees
            balances[feeAccount][_token] = balances[feeAccount][_token]
                .add(investments[_investmentId].traderFee)
                .add(investments[_investmentId].investorFee);

        } else {
            // take losses away from investor
            balances[_investorAddress][_token] = balances[_investorAddress][_token].add(investments[_investmentId].value);
            
            // add losses to trader balance
            balances[msg.sender][_token] = balances[msg.sender][_token]
                .add(investments[_investmentId].amount
                    .sub(investments[_investmentId].value)
                    .sub(investments[_investmentId].traderFee)
                );

            // fees
            balances[feeAccount][_token] = balances[feeAccount][_token]
                .add(investments[_investmentId].traderFee);
        }

        allocations[_trader.user][investments[_investmentId].token].invested = allocations[_trader.user][investments[_investmentId].token].invested.sub(investments[_investmentId].amount);
        
        investments[_investmentId].state = InvestmentState.Divested;

        emit ApproveExit(
            msg.sender,
            _investmentId,
            investments[_investmentId].traderProfit,
            investments[_investmentId].investorProfit
        );
    }

    /**
        Investor withdraws previously deposited ether funds, perhaps including profits (and losses)
    */
    function withdrawEther(uint256 _amount) external whenNotPaused {
        require(balances[msg.sender][ETHER] >= _amount);
        balances[msg.sender][ETHER] = balances[msg.sender][ETHER].sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, balances[msg.sender][ETHER]);
    }

    /**
        Investor withdraws previously deposited token funds, perhaps including profits (and losses)
    */
    function withdrawToken(address _token, uint256 _amount) external whenNotPaused {
        require(_token != ETHER);
        require(balances[msg.sender][_token] >= _amount);
        // require(IERC20(_token).transferFrom(address(this), msg.sender, _amount));
        require(IERC20(_token).transfer(msg.sender, _amount));
        balances[msg.sender][_token] = balances[msg.sender][_token].sub(_amount);
        emit Withdraw(_token, msg.sender, _amount, balances[msg.sender][_token]);
    }

}
