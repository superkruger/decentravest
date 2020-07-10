// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./TraderPaired.sol";

contract MultiSigFundWallet {

    address constant ETHER = address(0); // allows storage of ether in blank address in token mapping

    uint8 constant MAX_TOKENS = 20;

    address public fund;

    address public trader;
    address public investor;
    address public admin;

    uint32 private disbursementIdx;

    mapping (uint32 => Disbursement) private disbursements;
    uint32[] private pendingDisbursements;

    event SetTrader(address trader);
    event Fund(address trader, address investor, uint256 investmentId, address token, uint256 amount, uint256 date);
    event DisbursementCreated(address initiator, uint256 investmentId, uint32 disbursementId, uint256 date);
    event DisbursementCompleted(address initiator, address signedBy, uint256 investmentId, uint32 disbursementId, uint256 date);
    event Payout(address token, uint256 amount, address to);

    struct Disbursement {
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

    modifier hasTrader() {
        require(trader != address(0));
        _;
    }

    modifier hasNoTrader() {
        require(trader == address(0));
        _;
    }

    modifier traderOrInvestor() {
        require(msg.sender == investor || msg.sender == trader);
        _;
    }

    modifier validOwner() {
        require(msg.sender == trader || msg.sender == investor || msg.sender == admin);
        _;
    }

    modifier validSignature(uint32 disbursementId) {
        require(_validateSignature(disbursementId));
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

    function setTrader(address _trader) 
        public
        isInvestor
        hasNoTrader
    {
        require (_trader != investor && _trader != admin && _trader != fund);

        trader = _trader;
        emit SetTrader(_trader);
    }

    function replaceAdmin(address _admin) 
        external
        isAdmin
    {
        require (_admin != address(0) && _admin != investor && _admin != trader);
        admin = _admin;
    }

    function initiateFund(address _trader, address[] calldata _tokens, uint256[] calldata _amounts) 
        external
        payable 
    {
        setTrader(_trader);
        _batchFund(msg.value, _tokens, _amounts);
    }

    function batchFund(address[] calldata _tokens, uint256[] calldata _amounts) 
        external
        payable 
    {
        _batchFund(msg.value, _tokens, _amounts);
    }

    function _batchFund(uint256 _etherAmount, address[] memory _tokens, uint256[] memory _amounts) 
        internal
        isInvestor
        hasTrader
    {
        require (_tokens.length == _amounts.length && _tokens.length <= MAX_TOKENS);

        if (_etherAmount > 0) {
            _fundEther(_etherAmount);
        }

        for (uint8 i=0; i<_tokens.length; i++) {
            require (_tokens[i] != ETHER);
            _fundToken(_tokens[i], _amounts[i]);
        }
    }

    function fundEther() 
        external 
        payable
    {
        _fundEther(msg.value);
    }

    function fundToken(address _token, uint256 _amount)
        external 
    {
        _fundToken(_token, _amount);
    }

    function _fundEther(uint256 _amount) 
        internal
        isInvestor
        hasTrader
    {
        uint256 investmentId = TraderPaired(fund).invest(trader, investor, ETHER, _amount);
        emit Fund(trader, msg.sender, investmentId, ETHER, _amount, now);
    }

    function _fundToken(address _token, uint256 _amount)
        internal 
        isInvestor
        hasTrader
    {
        require(_token != ETHER);
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        uint256 investmentId = TraderPaired(fund).invest(trader, investor, _token, _amount);
        emit Fund(trader, msg.sender, investmentId, _token, _amount, now);
    }

    function disburseEther(uint256 _investmentId, uint256 _value)
        external
        payable
    {
        _disburse(msg.sender, _investmentId, ETHER, _value, msg.value);
    }

    function disburseToken(uint256 _investmentId, address _token, uint256 _value, uint256 _amount)
        external 
    {
        if (msg.sender == trader && _amount > 0) {
            require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        }
        _disburse(msg.sender, _investmentId, _token, _value, _amount);
    }

    function _disburse(address _initiator, uint256 _investmentId, address _token, uint256 _value, uint256 _amount)
        internal 
        traderOrInvestor
        hasTrader
    {
        if (_initiator == investor) {
            TraderPaired(fund).requestExitInvestor(trader, investor, _investmentId, _value);
        } else {
            TraderPaired(fund).requestExitTrader(trader, investor, _investmentId, _value, _amount);
        }

        uint32 _disbursementId = disbursementIdx++;

        Disbursement memory _disbursement;
        _disbursement.initiator = _initiator;
        _disbursement.investmentId = _investmentId;

        disbursements[_disbursementId] = _disbursement;
        pendingDisbursements.push(_disbursementId);

        emit DisbursementCreated(_initiator, _investmentId, _disbursementId, now);
    }

    function getPendingDisbursements()
      external
      view
      validOwner
      returns (uint32[] memory) 
    {
        return pendingDisbursements;
    }

    function approveDisbursementEther(uint32 _disbursementId)
      external
      payable 
    {
        _approveDisbursement(_disbursementId, ETHER, msg.value);
    }

    function approveDisbursementToken(uint32 _disbursementId, address _token, uint256 _amount)
      external
    {
        if (_amount > 0) {
            require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        }

        _approveDisbursement(_disbursementId, _token, _amount);
    }

    function _approveDisbursement(uint32 _disbursementId, address _token, uint256 _amount)
      internal
      validOwner
      hasTrader
      validSignature(_disbursementId)
    {
        Disbursement memory _disbursement = disbursements[_disbursementId];
        _executeDisbursement(_disbursementId, _token, _amount);
        emit DisbursementCompleted(_disbursement.initiator, msg.sender, _disbursement.investmentId, _disbursementId, now);
        deleteDisbursement(_disbursementId);
    }

    function _executeDisbursement(uint32 _disbursementId, address _token, uint256 _amount) 
        internal 
    {
        Disbursement storage _disbursement = disbursements[_disbursementId];
        uint256[3] memory _payouts = TraderPaired(fund).approveExit(trader, investor, _disbursement.investmentId, _token, _amount);

        if (_token == ETHER) {
            _payoutEther(_payouts[0], trader);
            _payoutEther(_payouts[1], investor);
            _payoutEther(_payouts[2], admin);
            
        } else {
            _payoutToken(_token, _payouts[0], trader);
            _payoutToken(_token, _payouts[1], investor);
            _payoutToken(_token, _payouts[2], admin);
        }
    }

    function _payoutEther(uint256 _amount, address _to) 
        internal
    {
        if (_amount > 0) {
            address payable _toAddress = address(uint160(_to));
            _toAddress.transfer(_amount);
            emit Payout(ETHER, _amount, _toAddress);
        }
    }

    function _payoutToken(address _token, uint256 _amount, address _to) 
        internal
    {
        if (_amount > 0) {
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

    function _validateSignature(uint32 _disbursementId)
        internal
        returns (bool)
    {
        Disbursement storage _disbursement = disbursements[_disbursementId];

        // disbursement must exist
        if(address(0) == _disbursement.initiator) {
            return false;
        }
        // Initiator cannot sign the disbursement
        if(msg.sender == _disbursement.initiator) {
            return false;
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
