// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./PairedInvestments.sol";
import "./MultiSigFundWalletFactory.sol";
import "./MultiSigFundWallet.sol";

contract TraderPaired is Initializable, Ownable, Pausable {
	using SafeMath for uint256;

    /*
     *  Constants
     */
    address constant ETHER = address(0); // allows storage of ether in blank address in token mapping
    address public feeAccount; // account that will receive fees

    /*
     *  Storage
     */
    mapping(address => _Trader) public traders;
    mapping(address => _Investor) public investors;

    address public multiSigFundWalletFactory;
    address public pairedInvestments;

    mapping(address => bool) public tokens;

    mapping(address => mapping(uint256 => uint256)) public traderInvestments;
    mapping(address => mapping(uint256 => uint256)) public investorInvestments;
    mapping(address => mapping(address => _Allocation)) public allocations;

    /*
     *  Events
     */
    event Trader(address indexed user, uint256 date);
    event Investor(address indexed user, uint256 date);
    event Investment(address indexed wallet, address indexed investor, uint256 date);
    event Allocate(address indexed trader, address indexed token, uint256 total, uint256 invested, uint256 date);
    event Invest(uint256 id, address indexed wallet, address indexed trader, address indexed investor, address token, uint256 amount, uint256 amountInvested, uint256 totalInvested, uint256 date);
    event Stop(uint256 id, address indexed wallet, address indexed trader, address indexed investor, address from, uint256 date);
    event RequestExit(uint256 id, address indexed wallet, address indexed trader, address indexed investor, address from, uint256 value, uint256 date);
    event ApproveExit(uint256 id, address indexed wallet, address indexed trader, address indexed investor, uint256 amountInvested, uint256 totalInvested, uint256 expected, uint256 date);

    /*
     *  Structs
     */
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

    /*
     *  Modifiers
     */
    modifier isTrader(address trader) {
        require(trader != address(0) && traders[trader].user == trader);
        _;
    }

    modifier isInvestor(address investor) {
        require(investor != address(0) && investors[investor].user == investor);
        _;
    }

    modifier notInvested(address trader, address investor) {
        require(!isInvested(trader, investor));
        _;
    }

    modifier onlyWallet {
        require(MultiSigFundWalletFactory(multiSigFundWalletFactory).isInstantiation(msg.sender));
        _;
    }

    function initialize(address _feeAccount) 
        public 
        initializer 
    {
        Ownable.initialize(msg.sender);
        Pausable.initialize(msg.sender);
        feeAccount = _feeAccount;
    }

    function setMultiSigFundWalletFactory(address _factory) 
        public 
        onlyOwner 
    {
        multiSigFundWalletFactory = _factory;
    }

    function setPairedInvestments(address _pairedInvestments) 
        public 
        onlyOwner 
    {
        pairedInvestments = _pairedInvestments;
    }

    // reverts if ether is sent directly
    function () external {
        revert();
    }

    function setToken(address _token, bool _valid) 
        external 
        onlyOwner 
    {
        tokens[_token] = _valid;
    }

    function joinAsTrader() 
        external 
        whenNotPaused 
    {
        require(traders[msg.sender].user == address(0));
        require(investors[msg.sender].user == address(0));

        traders[msg.sender] = _Trader({
            user: msg.sender, 
            investmentCount: 0
        });

        emit Trader(msg.sender, now);
    }

    function joinAsInvestor() 
        external 
        whenNotPaused 
    {
        require(traders[msg.sender].user == address(0));
        require(investors[msg.sender].user == address(0));

        investors[msg.sender] = _Investor({
                user: msg.sender,
                investmentCount: 0
            });

        emit Investor(msg.sender, now);
    }

    function allocate(address _token, uint256 _amount) 
        external 
        whenNotPaused 
    {
        require(tokens[_token]);
        _Trader memory _trader = traders[msg.sender];
        require(_trader.user == msg.sender);

        allocations[msg.sender][_token].total = _amount;

        emit Allocate(msg.sender, _token, _amount, allocations[msg.sender][_token].invested, now);
    }

    function isInvested(address _traderAddress, address _investorAddress) 
        internal
        view
        returns (bool) 
    {
        address[] memory wallets = MultiSigFundWalletFactory(multiSigFundWalletFactory).getInstantiations(_investorAddress);
        
        for(uint256 i = 0; i < wallets.length; i++) {
            if (MultiSigFundWallet(wallets[i]).traders(_traderAddress)) {
                return true;
            }
        }

        return false;
    }

    function createInvestment() 
        external
        whenNotPaused
        isInvestor(msg.sender)
    {
        address wallet = MultiSigFundWalletFactory(multiSigFundWalletFactory).create(address(this), msg.sender, feeAccount);
        emit Investment(wallet, msg.sender, now);
    }

    function invest(address _traderAddress, address _investorAddress, address _token, uint256 _amount) 
        public 
        whenNotPaused 
        onlyWallet 
        returns (uint256 investmentCount)
    {
        require(tokens[_token]);
        _Investor storage _investor = investors[_investorAddress];
        require(_investor.user == _investorAddress);

        _Trader storage _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);

        _Allocation storage allocation = allocations[_trader.user][_token];

        // falls within trader allocations
        require(allocation.total - allocation.invested >= _amount);
        allocation.invested = allocation.invested.add(_amount);

        investmentCount = PairedInvestments(pairedInvestments).invest(
            _traderAddress, 
            _investorAddress, 
            _token, 
            _amount
        );

        _trader.investmentCount = _trader.investmentCount.add(1);
        traderInvestments[_trader.user][_trader.investmentCount] = investmentCount;

        _investor.investmentCount = _investor.investmentCount.add(1);
        investorInvestments[_investor.user][_investor.investmentCount] = investmentCount;

        emit Invest(
            investmentCount,
            msg.sender,
            _traderAddress,
            _investorAddress,
            _token,
            _amount,
            allocation.invested,
            allocation.total,
            now
        );
    }

    //
    //    Trader/Investor stops an investment
    //
    function stop(address _traderAddress, address _investorAddress, address _from, uint256 _investmentId) 
        public 
        whenNotPaused 
        onlyWallet 
    {
        _Trader memory _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);

        PairedInvestments(pairedInvestments).stop(
            _traderAddress, 
            _investorAddress, 
            _investmentId);

        emit Stop(
            _investmentId,
            msg.sender,
            _traderAddress,
            _investorAddress,
            _from,
            now
        );
    }

    //
    //    Investor exits an investment
    //
    function requestExitInvestor(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value) 
        public 
        whenNotPaused 
        onlyWallet 
    {
        _Trader memory _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);

        PairedInvestments(pairedInvestments).requestExitInvestor(
            _traderAddress, 
            _investorAddress, 
            _investmentId, 
            _value);

        emit RequestExit(
            _investmentId,
            msg.sender,
            _traderAddress,
            _investorAddress,
            _investorAddress,
            _value,
            now
        );
    }

    //
    //    Trader exits an investment
    //
    function requestExitTrader(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value, uint256 _amount) 
        public 
        whenNotPaused 
        onlyWallet 
    {
        _Trader memory _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);

        PairedInvestments(pairedInvestments).requestExitTrader(
            _traderAddress, 
            _investorAddress, 
            _investmentId, 
            _value,
            _amount);

        emit RequestExit(
            _investmentId,
            msg.sender,
            _traderAddress,
            _investorAddress,
            _traderAddress,
            _value,
            now
        );
    }

    function approveExit(address _traderAddress, address _investorAddress, uint256 _investmentId, address _token, uint256 _amount) 
        public 
        whenNotPaused
        onlyWallet
        returns (uint256[3] memory payouts)
    {
        _Trader memory _trader = traders[_traderAddress];
        _Investor memory _investor = investors[_investorAddress];
        require(_trader.user == _traderAddress);
        require(_investor.user == _investorAddress);

        uint256[5] memory _result = PairedInvestments(pairedInvestments).approveExit(
            _traderAddress,
            _investorAddress, 
            _investmentId, 
            _amount);

        _Allocation storage allocation = allocations[_traderAddress][_token];

        allocation.invested = allocation.invested.sub(_result[3]);
        
        payouts[0] = _result[0];
        payouts[1] = _result[1];
        payouts[2] = _result[2];

        emit ApproveExit(
            _investmentId,
            msg.sender,
            _traderAddress,
            _investorAddress,
            allocation.invested,
            allocation.total,
            _result[4],
            now
        );
    }

}
