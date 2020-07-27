// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./TraderPaired.sol";

contract MultiSigFundWallet {
    using SafeMath for uint256;

    /*
     *  Constants
     */
    address constant ETHER = address(0); // allows storage of ether in blank address in token mapping
    uint8 constant MAX_TOKENS = 20;

    /*
     *  Storage
     */
    address public fund;
    mapping (address => bool) public traders;
    address public investor;
    address public admin;
    mapping (address => mapping (address => uint256)) balances;
    uint256 private disbursementIdx;
    mapping (uint256 => Disbursement) public disbursements;
    uint256[] private pendingDisbursements;

    /*
     *  Events
     */
    event SetTrader(address trader, bool active);
    event Fund(address trader, address investor, uint256 investmentId, address token, uint256 amount, uint256 date);
    event Stopped(address trader, address initiator, uint256 investmentId, uint256 date);
    event DisbursementCreated(address trader, address initiator, uint256 investmentId, uint256 disbursementId, address token, uint256 value, uint256 amount, uint256 date);
    event DisbursementCompleted(address initiator, address signedBy, uint256 investmentId, uint256 disbursementId, uint256 date);
    event DisbursementRejected(address initiator, uint256 investmentId, uint256 disbursementId, address token, uint256 value, uint256 amount, uint256 date);
    event Payout(address token, uint256 amount, address to);
    
    /*
     *  Structs
     */
    struct Disbursement {
        address trader;
        address initiator;
        uint256 investmentId;
        uint256 amount;
    }

    /*
     *  Modifiers
     */
    modifier isAdmin() {
        require(msg.sender == admin);
        _;
    }

    modifier isInvestor() {
        require(msg.sender == investor);
        _;
    }

    modifier isTrader(address _trader) {
        require(traders[_trader]);
        if (msg.sender != investor && msg.sender != admin) {
            require(msg.sender == _trader);
        }
        _;
    }

    modifier isNotTrader(address _trader) {
        require(!traders[_trader]);
        _;
    }

    modifier traderOrInvestor(address _trader) {
        require(msg.sender == investor || (traders[msg.sender] && msg.sender == _trader));
        _;
    }

    modifier validOwner() {
        require(msg.sender == investor || msg.sender == admin || traders[msg.sender]);
        _;
    }

    modifier validSignature(address trader, uint256 disbursementId) {
        require(_validateSignature(trader, disbursementId));
        _;
    }

    // @dev reverts if ether is sent directly
    function () external {
        revert();
    }

    /// @dev Constructor
    /// @param _fund Fund address
    /// @param _investor Investor address
    /// @param _admin Admin address
    constructor (address _fund, address _investor, address _admin)
        public
    {
        // all are unique and non-zero
        require (_fund != _investor && _fund != _admin && _investor != _admin && _admin != address(0));

        fund = _fund;
        investor = _investor;
        admin = _admin;
    }

    /// @dev Add/Remove a trader
    /// @param _trader Trader address
    /// @param _active set active or not
    function setTrader(address _trader, bool _active) 
        external
        isInvestor
    {
        // TODO: only deactivate on zero balances
        require (_trader != investor && _trader != admin && _trader != fund);

        traders[_trader] = _active;
        emit SetTrader(_trader, _active);
    }

    /// @dev Replace admin
    /// @param _admin Admin address
    function replaceAdmin(address _admin) 
        external
        isAdmin
    {
        require (_admin != address(0) && _admin != investor && !traders[_admin]);
        admin = _admin;
    }

    /// @dev Fund wallet with ether
    /// @param _trader Trader address
    function fundEther(address _trader) 
        external 
        payable
    {
        _fundEther(_trader, msg.value);
    }

    /// @dev Fund wallet with token
    /// @param _trader Trader address
    /// @param _token Token address
    /// @param _amount Amount of tokens
    function fundToken(address _trader, address _token, uint256 _amount)
        external 
    {
        _fundToken(_trader, _token, _amount);
    }

    /// @dev Fund wallet with ether
    /// @param _trader Trader address
    /// @param _amount Amount of ether
    function _fundEther(address _trader, uint256 _amount) 
        internal
        isInvestor
        isTrader(_trader)
    {
        uint256 investmentId = TraderPaired(fund).invest(_trader, investor, ETHER, _amount);
        balances[_trader][ETHER] = balances[_trader][ETHER].add(_amount);
        emit Fund(_trader, msg.sender, investmentId, ETHER, _amount, now);
    }

    /// @dev Fund wallet with token
    /// @param _trader Trader address
    /// @param _token Token address
    /// @param _amount Amount of tokens
    function _fundToken(address _trader, address _token, uint256 _amount)
        internal 
        isInvestor
        isTrader(_trader)
    {
        require(_token != ETHER);
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        uint256 investmentId = TraderPaired(fund).invest(_trader, investor, _token, _amount);
        balances[_trader][_token] = balances[_trader][_token].add(_amount);
        emit Fund(_trader, msg.sender, investmentId, _token, _amount, now);
    }

    /// @dev Stop investment
    /// @param _trader Trader address
    /// @param _investmentId Investment id
    function stop(address _trader, uint256 _investmentId)
        external
        traderOrInvestor(_trader)
        isTrader(_trader)
    {
        TraderPaired(fund).stop(_trader, investor, msg.sender, _investmentId);
        
        emit Stopped(_trader, msg.sender, _investmentId, now);
    }

    /// @dev Request investment disbursement in ether
    /// @param _trader Trader address
    /// @param _investmentId Investment id
    /// @param _value Investment value
    function disburseEther(address _trader, uint256 _investmentId, uint256 _value)
        external
        payable
    {
        _disburse(_trader, msg.sender, _investmentId, ETHER, _value, msg.value);
    }

    /// @dev Request investment disbursement in tokens
    /// @param _trader Trader address
    /// @param _investmentId Investment id
    /// @param _token Token address
    /// @param _value Investment value
    /// @param _amount transaction amount
    function disburseToken(address _trader, uint256 _investmentId, address _token, uint256 _value, uint256 _amount)
        external 
    {
        if (_amount > 0) {
            require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        }
        _disburse(_trader, msg.sender, _investmentId, _token, _value, _amount);
    }

    /// @dev Request investment disbursement
    /// @param _trader Trader address
    /// @param _initiator Initiator address
    /// @param _investmentId Investment id
    /// @param _token Token address
    /// @param _value Investment value
    /// @param _amount transaction amount
    function _disburse(address _trader, address _initiator, uint256 _investmentId, address _token, uint256 _value, uint256 _amount)
        internal 
        traderOrInvestor(_trader)
        isTrader(_trader)
    {
        if (_initiator == investor) {
            TraderPaired(fund).requestExitInvestor(_trader, investor, _investmentId, _value);
        } else {
            TraderPaired(fund).requestExitTrader(_trader, investor, _investmentId, _value, _amount);
        }

        if (_amount > 0) {
            balances[_trader][_token] = balances[_trader][_token].add(_amount);
        }

        uint256 _disbursementId = disbursementIdx++;

        Disbursement memory _disbursement;
        _disbursement.trader = _trader;
        _disbursement.initiator = _initiator;
        _disbursement.investmentId = _investmentId;
        _disbursement.amount = _amount;

        disbursements[_disbursementId] = _disbursement;
        pendingDisbursements.push(_disbursementId);

        emit DisbursementCreated(_trader, _initiator, _investmentId, _disbursementId, _token, _value, _amount, now);
    }

    /// @dev Get pending disbursements
    function getPendingDisbursements()
      external
      view
      validOwner
      returns (uint256[] memory) 
    {
        return pendingDisbursements;
    }

    /// @dev Approve ether disbursement
    /// @param _trader Trader address
    /// @param _disbursementId disbursement id
    function approveDisbursementEther(address _trader, uint256 _disbursementId)
      external
      payable 
    {
        _approveDisbursement(_trader, _disbursementId, ETHER, msg.value);
    }

    /// @dev Approve token disbursement
    /// @param _trader Trader address
    /// @param _disbursementId disbursement id
    /// @param _token Token address
    /// @param _amount transaction amount
    function approveDisbursementToken(address _trader, uint256 _disbursementId, address _token, uint256 _amount)
      external
    {
        if (_amount > 0) {
            require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        }

        _approveDisbursement(_trader, _disbursementId, _token, _amount);
    }

    /// @dev Approve disbursement
    /// @param _trader Trader address
    /// @param _disbursementId disbursement id
    /// @param _token Token address
    /// @param _amount transaction amount
    function _approveDisbursement(address _trader, uint256 _disbursementId, address _token, uint256 _amount)
      internal
      validOwner
      isTrader(_trader)
      validSignature(_trader, _disbursementId)
    {
        Disbursement memory _disbursement = disbursements[_disbursementId];
        _executeDisbursement(_trader, _disbursementId, _token, _amount);
        emit DisbursementCompleted(_disbursement.initiator, msg.sender, _disbursement.investmentId, _disbursementId, now);
        _deleteDisbursement(_disbursementId);
    }

    /// @dev Reject disbursement
    /// @param _trader Trader address
    /// @param _disbursementId disbursement id
    function rejectDisbursement(address _trader, uint256 _disbursementId, address _token, uint256 _value)
      external
      validOwner
      isTrader(_trader)
    {
        Disbursement memory _disbursement = disbursements[_disbursementId];
        TraderPaired(fund).rejectExit(_trader, _disbursement.investmentId, _value, msg.sender);
        
        if (_disbursement.amount > 0) {
            if (_token == ETHER) {
                _payoutEther(_trader, _disbursement.amount, _disbursement.initiator);
            } else {
                _payoutToken(_trader, _token, _disbursement.amount, _disbursement.initiator);
            }
        }
        
        emit DisbursementRejected(msg.sender, _disbursement.investmentId, _disbursementId, _token, _value, _disbursement.amount, now);
        _deleteDisbursement(_disbursementId);
    }

    /// @dev Fulfill disbursement
    /// @param _trader Trader address
    /// @param _disbursementId disbursement id
    /// @param _token Token address
    /// @param _amount transaction amount
    function _executeDisbursement(address _trader, uint256 _disbursementId, address _token, uint256 _amount) 
        internal 
    {
        Disbursement storage _disbursement = disbursements[_disbursementId];
        uint256[3] memory _payouts = TraderPaired(fund).approveExit(_trader, investor, _disbursement.investmentId, _token, _amount);

        if (_amount > 0) {
            balances[_trader][_token] = balances[_trader][_token].add(_amount);
        }

        if (_token == ETHER) {
            _payoutEther(_trader, _payouts[0], _trader);
            _payoutEther(_trader, _payouts[1], investor);
            _payoutEther(_trader, _payouts[2], admin);
            
        } else {
            _payoutToken(_trader, _token, _payouts[0], _trader);
            _payoutToken(_trader, _token, _payouts[1], investor);
            _payoutToken(_trader, _token, _payouts[2], admin);
        }
    }

    /// @dev Payout ether
    /// @param _trader Trader address
    /// @param _amount payment amount
    /// @param _to Target address
    function _payoutEther(address _trader, uint256 _amount, address _to) 
        internal
    {
        if (_amount > 0) {
            address payable _toAddress = address(uint160(_to));
            balances[_trader][ETHER] = balances[_trader][ETHER].sub(_amount);
            _toAddress.transfer(_amount);
            emit Payout(ETHER, _amount, _toAddress);
        }
    }

    /// @dev Payout tokens
    /// @param _trader Trader address
    /// @param _token Token address
    /// @param _amount payment amount
    /// @param _to Target address
    function _payoutToken(address _trader, address _token, uint256 _amount, address _to) 
        internal
    {
        if (_amount > 0) {
            balances[_trader][_token] = balances[_trader][_token].sub(_amount);
            require(IERC20(_token).transfer(_to, _amount));
            emit Payout(_token, _amount, _to);
        }
    }

    /// @dev Delete disbursement
    /// @param _disbursementId Disbursement id
    function _deleteDisbursement(uint256 _disbursementId)
      internal 
    {
        uint8 replace = 0;
        for(uint256 i = 0; i < pendingDisbursements.length; i++) {
            if (1 == replace) {
                pendingDisbursements[i-1] = pendingDisbursements[i];
            } else if (_disbursementId == pendingDisbursements[i]) {
                replace = 1;
            }
        }
        delete pendingDisbursements[pendingDisbursements.length - 1];
        pendingDisbursements.length--;
        delete disbursements[_disbursementId];
    }

    /// @dev Validate disbursement signature
    /// @param _trader Trader address
    /// @param _disbursementId Disbursement id
    /// @return true if disbursement approval is valid
    function _validateSignature(address _trader, uint256 _disbursementId)
        internal
        view
        returns (bool)
    {
        Disbursement storage _disbursement = disbursements[_disbursementId];

        require (_disbursement.trader == _trader);

        // disbursement must exist
        if(address(0) == _disbursement.initiator) {
            return false;
        }
        // Initiator cannot sign the disbursement
        if(msg.sender == _disbursement.initiator) {
            return false;
        }
        // if a trader is signing, it must match the trader for this disbursement
        if(traders[msg.sender]) {
            require (_disbursement.trader == msg.sender);
        }

        return true;
    }

    /// @dev Get wallet ether balance
    /// @return ether balance
    function etherBalance()
        external
        view
        returns (uint256) 
    {
        return address(this).balance;
    }

    /// @dev Get wallet token balance
    /// @param _token Token address
    /// @return token balance
    function tokenBalance(address _token)
        external
        view
        returns (uint256) 
    {
        return IERC20(_token).balanceOf(address(this));
    }
}
