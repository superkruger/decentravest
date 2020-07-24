// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./Factory.sol";
import "./MultiSigFundWallet.sol";

contract MultiSigFundWalletFactory is Factory, Ownable {

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

    function initialize() 
        public 
        initializer 
    {
        Ownable.initialize(msg.sender);
    }

    function setManager(address _manager) 
        public 
        onlyOwner 
    {
        manager = _manager;
    }

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
