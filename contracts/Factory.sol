// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

contract Factory {

    /*
     *  Events
     */
    event ContractInstantiation(address creator, address instantiation);

    /*
     *  Storage
     */
    mapping(address => bool) public isInstantiation;
    mapping(address => address[]) public instantiations;

    /*
     * Public functions
     */
    /// @dev Returns number of instantiations by creator.
    /// @param creator Contract creator.
    /// @return Returns number of instantiations by creator.
    function getInstantiationCount(address creator)
        public
        view
        returns (uint)
    {
        return instantiations[creator].length;
    }

    function getInstantiations(address creator)
        public
        view
        returns (address[] memory)
    {
        return instantiations[creator];
    }

    /*
     * Internal functions
     */
    /// @dev Registers contract in factory registry.
    /// @param _instantiation Address of contract instantiation.
    /// @param _creator Address of contract creator.
    function register(address _instantiation, address _creator)
        internal
    {
        isInstantiation[_instantiation] = true;
        instantiations[_creator].push(_instantiation);
        emit ContractInstantiation(_creator, _instantiation);
    }
}
