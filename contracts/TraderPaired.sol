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

    mapping(uint256 => address) public traderAddresses;
    mapping(uint256 => address) public investorAddresses;

    uint256 public traderCount;
    uint256 public investorCount;

    /*
     *  Events
     */
    event Trader(address indexed user, uint256 traderId, uint256 date);
    event Investor(address indexed user, uint256 investorId, uint256 date);
    event Investment(address indexed wallet, address indexed investor, uint256 date);
    event Allocate(address indexed trader, address indexed token, uint256 total, uint256 invested, uint256 date);
    event Invest(uint256 id, address indexed wallet, address indexed trader, address indexed investor, address token, uint256 amount, uint256 allocationInvested, uint256 allocationTotal, uint256 date);
    event Stop(uint256 id, address indexed wallet, address indexed trader, address indexed investor, address from, uint256 date);
    event RequestExit(uint256 id, address indexed wallet, address indexed trader, address indexed investor, address from, uint256 value, uint256 date);
    event ApproveExit(uint256 id, address indexed wallet, address indexed trader, address indexed investor, uint256 allocationInvested, uint256 allocationTotal, uint256 date);
    event RejectExit(uint256 id, address indexed wallet, address indexed trader, uint256 value, address from, uint256 date);

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

    /// @dev Initialize
    /// @param _feeAccount fee account
    function initialize(address _feeAccount) 
        public 
        initializer 
    {
        Ownable.initialize(msg.sender);
        Pausable.initialize(msg.sender);
        feeAccount = _feeAccount;
    }

    /// @dev set MultiSigFundWalletFactory
    /// @param _factory contract address
    function setMultiSigFundWalletFactory(address _factory) 
        public 
        onlyOwner 
    {
        multiSigFundWalletFactory = _factory;
    }

    /// @dev set PairedInvestments
    /// @param _pairedInvestments contract address
    function setPairedInvestments(address _pairedInvestments) 
        public 
        onlyOwner 
    {
        pairedInvestments = _pairedInvestments;
    }

    /// @dev reverts if ether is sent directly
    function () external {
        revert();
    }

    /// @dev activate/deactivate token
    /// @param _token token address
    /// @param _valid active or not
    function setToken(address _token, bool _valid) 
        external 
        onlyOwner 
    {
        tokens[_token] = _valid;
    }

    /// @dev Join as trader
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

        traderCount = traderCount.add(1);
        traderAddresses[traderCount] = msg.sender;

        emit Trader(msg.sender, traderCount, now);
    }

    /// @dev Join as investor
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

        investorCount = investorCount.add(1);
        investorAddresses[investorCount] = msg.sender;

        emit Investor(msg.sender, investorCount, now);
    }

    /// @dev Allocate amount of tokens
    /// @param _token token address
    /// @param _amount amount to allocate
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

    /// @dev Checks if investor is invested with trader
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @return invested
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

    /// @dev Checks if investor has a wallet
    /// @param _investorAddress investor address
    /// @return has wallet
    function hasWallet(address _investorAddress) 
        internal
        view
        returns (bool) 
    {
        return MultiSigFundWalletFactory(multiSigFundWalletFactory).isInstantiation(_investorAddress);
    }

    /// @dev Create new investment wallet
    function createInvestment() 
        external
        whenNotPaused
        isInvestor(msg.sender)
    {
        require(!hasWallet(msg.sender));
        address wallet = MultiSigFundWalletFactory(multiSigFundWalletFactory).create(address(this), msg.sender, feeAccount);
        emit Investment(wallet, msg.sender, now);
    }

    /// @dev Invest
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _token token address
    /// @param _amount amount to invest
    /// @return investment id
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

        uint256 starttime;
        (investmentCount, starttime) = PairedInvestments(pairedInvestments).invest(
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
            starttime
        );
    }

    /// @dev Trader/Investor stops an investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _from initiator address
    /// @param _investmentId investment id
    function stop(address _traderAddress, address _investorAddress, address _from, uint256 _investmentId) 
        public 
        whenNotPaused 
        onlyWallet 
    {
        _Trader memory _trader = traders[_traderAddress];
        require(_trader.user == _traderAddress);

        uint256 stoptime = PairedInvestments(pairedInvestments).stop(
            _traderAddress, 
            _investorAddress, 
            _investmentId);

        emit Stop(
            _investmentId,
            msg.sender,
            _traderAddress,
            _investorAddress,
            _from,
            stoptime
        );
    }

    /// @dev Investor requests to exit an investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @param _value investment value
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
    
    /// @dev Trader requests to exit an investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @param _value investment value
    /// @param _amount transaction amount
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

    /// @dev Approve exit of investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @param _token token address
    /// @param _amount transaction amount
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

        uint256[4] memory _result = PairedInvestments(pairedInvestments).approveExit(
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
            now
        );
    }

    /// @dev Reject exit of investment
    /// @param _traderAddress trader address
    /// @param _investmentId investment id
    /// @param _value proposed investment value
    /// @param _from initiator address
    function rejectExit(address _traderAddress, uint256 _investmentId, uint256 _value, address _from)
        public 
        whenNotPaused
        onlyWallet
    {
        PairedInvestments(pairedInvestments).rejectExit(
            _traderAddress,
            _investmentId,
            _value
        );

        emit RejectExit(
            _investmentId,
            msg.sender,
            _traderAddress,
            _value,
            _from,
            now
        );
    }


}
