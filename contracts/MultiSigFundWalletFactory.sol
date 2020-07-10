// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

import "./Factory.sol";
import "./MultiSigFundWallet.sol";

contract MultiSigFundWalletFactory is Factory {

    function create(address _fund, address _investor, address _admin)
        public
        returns (address wallet)
    {
        MultiSigFundWallet msfw = new MultiSigFundWallet(_fund, _investor, _admin);
        wallet = address(msfw);
        register(wallet);
    }
}
