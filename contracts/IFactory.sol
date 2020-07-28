// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

interface IFactory {

    function isInstantiation(address _instantiation)
    	external
    	view
    	returns (bool);

    function getInstantiations(address creator)
        external
        view
        returns (address[] memory);
}
