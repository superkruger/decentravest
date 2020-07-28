// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;


interface IMultiSigFundWalletFactory {

    /// @dev Create a new multisig wallet
    /// @param _fund Fund address
    /// @param _investor Investor address
    /// @param _admin Wallet admin address
    /// @return new wallet address
    function create(address _fund, address _investor, address _admin)
        external
        returns (address);
}
