// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

interface IMultiSigFundWallet {

	/// @dev get trader status
    function traders(address _trader)
        external
        view
        returns (bool);
}
