// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./PairedInvestments.sol";

contract TraderPaired is Initializable, Ownable, Pausable {
	using SafeMath for uint256;

    address constant ETHER = address(0); // allows storage of ether in blank address in token mapping
    address public feeAccount; // account that will receive fees

    mapping(address => _Trader) public traders;
    // mapping(address => _Investor) public investors;

    // address public pairedInvestments;

    // mapping(address => bool) public tokens;

    // mapping(address => mapping(uint256 => uint256)) public traderInvestments;
    // mapping(address => mapping(uint256 => uint256)) public investorInvestments;
    // mapping(address => mapping(address => _Allocation)) public allocations;

    // mapping(address => mapping(address => uint256)) public balances; // mapping of token balances to addresses

    event Trader(address indexed trader, uint256 date);
    // event Investor(address indexed investor, uint256 date);
    // event Allocate(address indexed trader, address token, uint256 amount);
    // event Withdraw(address indexed token, address indexed user, uint256 amount, uint256 balance, uint256 date);
    // event Invest(uint256 id, address indexed investor, address indexed trader, address indexed token, uint256 amount);
    // event RequestExit(address indexed trader, uint256 investmentId, uint256 date, uint256 value);
    // event RejectExit(address indexed trader, uint256 investmentId, uint256 value, uint256 date);
    // event ApproveExit(address indexed trader, uint256 investmentId, uint256 date);

    struct _Trader {
        address user;
        uint256 investmentCount;
    }

    struct _Allocation {
        uint256 total;
        uint256 invested;
    }

    struct _Investor {
        address user;
        uint256 investmentCount;
    }

    function initialize(
            address _feeAccount
            ) public initializer {
        Ownable.initialize(msg.sender);
        Pausable.initialize(msg.sender);
        feeAccount = _feeAccount;
    }

    // function setPairedInvestments(
    //         address _pairedInvestments
    //         ) public onlyOwner {
    //     pairedInvestments = _pairedInvestments;
    // }

    // reverts if ether is sent directly
    function () external {
        revert();
    }

    // function setToken(address _token, bool _valid) external onlyOwner {
    //     tokens[_token] = _valid;
    // }

    function joinAsTrader() external whenNotPaused {
        require(traders[msg.sender].user == address(0));
        // require(investors[msg.sender].user == address(0));

        traders[msg.sender] = _Trader({
            user: msg.sender, 
            investmentCount: 0
        });

        emit Trader(msg.sender, now);
    }

    // function joinAsInvestor() external whenNotPaused {
    //     require(traders[msg.sender].user == address(0));
    //     require(investors[msg.sender].user == address(0));

    //     investors[msg.sender] = _Investor({
    //             user: msg.sender,
    //             investmentCount: 0
    //         });

    //     emit Investor(msg.sender, now);
    // }

    // function allocate(address _token, uint256 _amount) external whenNotPaused {
    //     require(tokens[_token]);
    //     _Trader memory _trader = traders[msg.sender];
    //     require(_trader.user == msg.sender);

    //     allocations[msg.sender][_token].total = _amount;

    //     emit Allocate(msg.sender, _token, _amount);
    // }

    // //
    // //    Investor invests
    // //
    // function investEther(address _traderAddress) external payable whenNotPaused {
    //     _invest(_traderAddress, ETHER, msg.value);
    // }

    // //
    // //    Investor invests
    // //
    // function investToken(address _traderAddress, address _token, uint256 _amount) external whenNotPaused {
    //     require(tokens[_token]);
    //     require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
    //     _invest(_traderAddress, _token, _amount);
    // }

    // function _invest(address _traderAddress, address _token, uint256 _amount) internal {
    //     _Investor storage _investor = investors[msg.sender];
    //     require(_investor.user == msg.sender);

    //     _Trader storage _trader = traders[_traderAddress];
    //     require(_trader.user == _traderAddress);

    //     _Allocation storage allocation = allocations[_trader.user][_token];

    //     // falls within trader allocations
    //     require(allocation.total - allocation.invested >= _amount);
    //     allocation.invested = allocation.invested.add(_amount);

    //     uint256 investmentCount = PairedInvestments(pairedInvestments).invest(
    //         _traderAddress, 
    //         msg.sender, 
    //         _token, 
    //         _amount
    //     );

    //     _trader.investmentCount = _trader.investmentCount.add(1);
    //     traderInvestments[_trader.user][_trader.investmentCount] = investmentCount;

    //     _investor.investmentCount = _investor.investmentCount.add(1);
    //     investorInvestments[_investor.user][_investor.investmentCount] = investmentCount;

    //     emit Invest(
    //         investmentCount,
    //         msg.sender,
    //         _trader.user,
    //         _token,
    //         _amount
    //     );
    // }

    // //
    // //    Investor exits an investment
    // //
    // function requestExit(address _traderAddress, uint256 _investmentId, address _token, uint256 _value) external whenNotPaused {
    //     require(tokens[_token]);
    //     _Trader memory _trader = traders[_traderAddress];
    //     require(_trader.user == _traderAddress);
 
    //     address[2] memory _addressArgs = [
    //         _traderAddress, 
    //         msg.sender];

    //     uint256[5] memory _uint256Args = [
    //         _investmentId, 
    //         _value,
    //         balances[_traderAddress][_token],
    //         balances[msg.sender][_token],
    //         balances[feeAccount][_token]];

    //     uint256[4] memory _result = PairedInvestments(pairedInvestments).requestExit(_addressArgs, _uint256Args);

    //     balances[_traderAddress][_token] = _result[0];
    //     balances[msg.sender][_token] = _result[1];
    //     balances[feeAccount][_token] = _result[2];

    //     emit RequestExit(
    //         _traderAddress,
    //         _investmentId, 
    //         _result[3], 
    //         _value
    //     );
    // }

    // //
    // //    Trader rejects the exit request. 
    // //    Perhaps the investor made a false profit claim. 
    // //    This will now enter a dispute workflow managed on the client
    // //
    // function rejectExit(uint256 _investmentId, uint256 _value) external whenNotPaused {
    //     PairedInvestments(pairedInvestments).rejectExit(
    //         msg.sender,
    //         _investmentId
    //     );

    //     emit RejectExit(
    //         msg.sender, 
    //         _investmentId,
    //         _value,
    //         now
    //     );
    // }

    // //
    // //    Trader approves the exit by paying the nett profit back to the contract, under the name of the investor
    // //
    // function approveExitEther(address _investorAddress, uint256 _investmentId) external payable whenNotPaused {
    //     _approveExit(_investorAddress, _investmentId, ETHER, msg.value);
    // }

    // //
    // //    Trader approves the exit by paying the nett profit back to the contract, under the name of the investor
    // //
    // function approveExitToken(address _investorAddress, uint256 _investmentId, address _token, uint256 _amount) external whenNotPaused {
    //     require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
    //     _approveExit(_investorAddress, _investmentId, _token, _amount);
    // }

    // function _approveExit(address _investorAddress, uint256 _investmentId, address _token, uint256 _amount) internal {
    //     _Trader memory _trader = traders[msg.sender];
    //     _Investor memory _investor = investors[_investorAddress];
    //     require(_trader.user == msg.sender);
    //     require(_investor.user == _investorAddress);

    //     address[2] memory _addressArgs = [
    //         msg.sender,
    //         _investorAddress];

    //     uint256[5] memory _uint256Args = [
    //         _investmentId, 
    //         _amount,
    //         balances[msg.sender][_token],
    //         balances[_investorAddress][_token],
    //         balances[feeAccount][_token]];

    //     uint256[4] memory _result = PairedInvestments(pairedInvestments).approveExit(_addressArgs, _uint256Args);

    //     allocations[msg.sender][_token].invested = allocations[msg.sender][_token].invested.sub(_result[3]);
        
    //     balances[msg.sender][_token] = _result[0];
    //     balances[_investorAddress][_token] = _result[1];
    //     balances[feeAccount][_token] = _result[2];

    //     emit ApproveExit(
    //         msg.sender,
    //         _investmentId,
    //         now
    //     );
    // }

    // //
    // //    Investor withdraws previously deposited ether funds, perhaps including profits (and losses)
    // //
    // function withdrawEther(uint256 _amount) external whenNotPaused {
    //     uint256 balance = balances[msg.sender][ETHER];
    //     balances[msg.sender][ETHER] = balance.sub(_amount);
    //     msg.sender.transfer(_amount);
    //     emit Withdraw(ETHER, msg.sender, _amount, balances[msg.sender][ETHER], now);
    // }

    // //
    // //    Investor withdraws previously deposited token funds, perhaps including profits (and losses)
    // //
    // function withdrawToken(address _token, uint256 _amount) external whenNotPaused {
    //     require(_token != ETHER);
    //     uint256 balance = balances[msg.sender][_token];
    //     // require(IERC20(_token).transferFrom(address(this), msg.sender, _amount));
    //     require(IERC20(_token).transfer(msg.sender, _amount));
    //     balances[msg.sender][_token] = balance.sub(_amount);
    //     emit Withdraw(_token, msg.sender, _amount, balances[msg.sender][_token], now);
    // }

}
