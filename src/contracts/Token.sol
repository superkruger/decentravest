// "SPDX-License-Identifier: UNLICENSED"
pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";

contract Token is ERC20Capped {
	constructor() public ERC20("Demo Token", "DTK") ERC20Capped(1000000 * (10 ** 18))  {
	}
}