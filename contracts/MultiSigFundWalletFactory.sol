// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./Factory.sol";
import "./MultiSigFundWallet.sol";
import "./IMultiSigFundWalletFactory.sol";


contract MultiSigFundWalletFactory is Factory, Ownable, IMultiSigFundWalletFactory {

	/*
     *  Storage
     */
	address public manager;

	/*
     *  Modifiers
     */
    modifier onlyManager() {
        require(manager == msg.sender);
        _;
    }

    /// @dev Initialize
    function initialize() 
        public 
        initializer 
    {
        Ownable.initialize(msg.sender);
    }

    /// @dev Set manager contract address
    /// @param _manager Manager address
    function setManager(address _manager) 
        public 
        onlyOwner 
    {
        manager = _manager;
    }

    /// @dev Create a new multisig wallet
    /// @param _fund Fund address
    /// @param _investor Investor address
    /// @param _admin Wallet admin address
    /// @return new wallet address
    function create(address _fund, address _investor, address _admin)
        public
        onlyManager
        returns (address wallet)
    {
        MultiSigFundWallet msfw = new MultiSigFundWallet(_fund, _investor, _admin);
        wallet = address(msfw);
        register(wallet, _investor);
    }
}
