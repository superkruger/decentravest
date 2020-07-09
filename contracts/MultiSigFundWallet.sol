// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./TraderPaired.sol";

contract MultiSigFundWallet {

    address constant ETHER = address(0); // allows storage of ether in blank address in token mapping

    address public fund;

    address public trader;
    address public investor;
    address public admin;

    uint32 private disbursementIdx;

    mapping (uint32 => Disbursement) private disbursements;
    uint32[] private pendingDisbursements;

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

    constructor (address _fund, address _trader, address _investor, address _admin)
        public
    {
        require (_fund != address(0));

        // all are unique and non-zero
        require (_trader != _investor && _trader != _admin && _investor != _admin && _admin != address(0));

        fund = _fund;
        trader = _trader;
        investor = _investor;
        admin = _admin;
    }

    function replaceAdmin(address _admin) 
        external
        isAdmin
    {
        admin = _admin;
    }

    function fundEther() 
        payable 
        external
        isInvestor
    {
        uint256 investmentId = TraderPaired(fund).invest(trader, investor, ETHER, msg.value);
        emit Fund(trader, msg.sender, investmentId, ETHER, msg.value, now);
    }

    function fundToken(address _token, uint256 _amount)
        external 
        isInvestor
    {
        require(_token != ETHER);
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));
        uint256 investmentId = TraderPaired(fund).invest(trader, investor, _token, _amount);
        emit Fund(trader, msg.sender, investmentId, _token, _amount, now);
    }

    function disburseEther(uint256 _investmentId, uint256 _value)
        external 
    {
        _disburse(msg.sender, _investmentId, ETHER, _value);
    }

    function disburseToken(uint256 _investmentId, address _token, uint256 _value)
        external 
    {
        _disburse(msg.sender, _investmentId, _token, _value);
    }

    function _disburse(address _initiator, uint256 _investmentId, address _token, uint256 _value)
        internal 
        validOwner
    {
        TraderPaired(fund).requestExit(trader, investor, _investmentId, _value);

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
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount));

        _approveDisbursement(_disbursementId, _token, _amount);
    }

    function _approveDisbursement(uint32 _disbursementId, address _token, uint256 _amount)
      internal
      validOwner
      validSignature(_disbursementId)
    {
        Disbursement memory _disbursement = disbursements[_disbursementId];
        _executeDisbursement(_disbursementId, _token, _amount);
        emit DisbursementCompleted(_disbursement.initiator, msg.sender, _disbursement.investmentId, _disbursementId, now);
        _deleteDisbursement(_disbursementId);
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

    function _deleteDisbursement(uint32 _disbursementId)
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
