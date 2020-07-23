// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./TraderPaired.sol";

contract MultiSigFundWallet {
    using SafeMath for uint256;

    address constant ETHER = address(0); // allows storage of ether in blank address in token mapping

    uint8 constant MAX_TOKENS = 20;

    address public fund;

    mapping (address => bool) public traders;
    address public investor;
    address public admin;

    mapping (address => mapping (address => uint256)) balances;

    uint32 private disbursementIdx;

    mapping (uint32 => Disbursement) public disbursements;
    uint32[] private pendingDisbursements;

    event SetTrader(address trader, bool active);
    event Fund(address trader, address investor, uint256 investmentId, address token, uint256 amount, uint256 date);
    event Stopped(address trader, address initiator, uint256 investmentId, uint256 date);
    event DisbursementCreated(address trader, address initiator, uint256 investmentId, uint32 disbursementId, address token, uint256 value, uint256 amount, uint256 date);
    event DisbursementCompleted(address initiator, address signedBy, uint256 investmentId, uint32 disbursementId, uint256 date);
    event Payout(address token, uint256 amount, address to);

    struct Disbursement {
        address trader;
        address initiator;
        uint256 investmentId;
    }

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

    modifier validSignature(address trader, uint32 disbursementId) {
        require(_validateSignature(trader, disbursementId));
        _;
    }

    // @dev reverts if ether is sent directly
    function () external {
        revert();
    }

    constructor (address _fund, address _investor, address _admin)
        public
    {
        // all are unique and non-zero
        require (_fund != _investor && _fund != _admin && _investor != _admin && _admin != address(0));

        fund = _fund;
        investor = _investor;
        admin = _admin;
    }

    function setTrader(address _trader, bool _active) 
        external
        isInvestor
    {
        // TODO: only deactivate on zero balances
        require (_trader != investor && _trader != admin && _trader != fund);

        traders[_trader] = _active;
        emit SetTrader(_trader, _active);
    }

    function replaceAdmin(address _admin) 
        external
        isAdmin
    {
        require (_admin != address(0) && _admin != investor && !traders[_admin]);
        admin = _admin;
    }

    function fundEther(address _trader) 
        external 
        payable
    {
        _fundEther(_trader, msg.value);
    }

    function fundToken(address _trader, address _token, uint256 _amount)
        external 
    {
        _fundToken(_trader, _token, _amount);
    }

    function _fundEther(address _trader, uint256 _amount) 
        internal
        isInvestor
        isTrader(_trader)
    {
        uint256 investmentId = TraderPaired(fund).invest(_trader, investor, ETHER, _amount);
        balances[_trader][ETHER] = balances[_trader][ETHER].add(_amount);
        emit Fund(_trader, msg.sender, investmentId, ETHER, _amount, now);
    }

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

    function stop(address _trader, uint256 _investmentId)
        external
        traderOrInvestor(_trader)
        isTrader(_trader)
    {
        TraderPaired(fund).stop(_trader, investor, msg.sender, _investmentId);
        
        emit Stopped(_trader, msg.sender, _investmentId, now);
    }

    function disburseEther(address _trader, uint256 _investmentId, uint256 _value)
        external
        payable
    {
        _disburse(_trader, msg.sender, _investmentId, ETHER, _value, msg.value);
    }

    function disburseToken(address _trader, uint256 _investmentId, address _token, uint256 _value, uint256 _amount)
        external 
    {
        if (_amount > 0) {
            require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        }
        _disburse(_trader, msg.sender, _investmentId, _token, _value, _amount);
    }

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

        uint32 _disbursementId = disbursementIdx++;

        Disbursement memory _disbursement;
        _disbursement.trader = _trader;
        _disbursement.initiator = _initiator;
        _disbursement.investmentId = _investmentId;

        disbursements[_disbursementId] = _disbursement;
        pendingDisbursements.push(_disbursementId);

        emit DisbursementCreated(_trader, _initiator, _investmentId, _disbursementId, _token, _value, _amount, now);
    }

    function getPendingDisbursements()
      external
      view
      validOwner
      returns (uint32[] memory) 
    {
        return pendingDisbursements;
    }

    function approveDisbursementEther(address _trader, uint32 _disbursementId)
      external
      payable 
    {
        _approveDisbursement(_trader, _disbursementId, ETHER, msg.value);
    }

    function approveDisbursementToken(address _trader, uint32 _disbursementId, address _token, uint256 _amount)
      external
    {
        if (_amount > 0) {
            require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        }

        _approveDisbursement(_trader, _disbursementId, _token, _amount);
    }

    function _approveDisbursement(address _trader, uint32 _disbursementId, address _token, uint256 _amount)
      internal
      validOwner
      isTrader(_trader)
      validSignature(_trader, _disbursementId)
    {
        Disbursement memory _disbursement = disbursements[_disbursementId];
        _executeDisbursement(_trader, _disbursementId, _token, _amount);
        emit DisbursementCompleted(_disbursement.initiator, msg.sender, _disbursement.investmentId, _disbursementId, now);
        deleteDisbursement(_disbursementId);
    }

    function _executeDisbursement(address _trader, uint32 _disbursementId, address _token, uint256 _amount) 
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

    function _payoutToken(address _trader, address _token, uint256 _amount, address _to) 
        internal
    {
        if (_amount > 0) {
            balances[_trader][_token] = balances[_trader][_token].sub(_amount);
            require(IERC20(_token).transfer(_to, _amount));
            emit Payout(_token, _amount, _to);
        }
    }

    function deleteDisbursement(uint32 _disbursementId)
      public 
      validOwner
    {
        uint8 replace = 0;
        for(uint32 i = 0; i < pendingDisbursements.length; i++) {
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

    function _validateSignature(address _trader, uint32 _disbursementId)
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

    function etherBalance()
        external
        view
        returns (uint256) 
    {
        return address(this).balance;
    }

    function tokenBalance(address _token)
        external
        view
        returns (uint256) 
    {
        return IERC20(_token).balanceOf(address(this));
    }
}
