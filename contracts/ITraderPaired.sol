// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

interface ITraderPaired {

    /// @dev Invest
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _token token address
    /// @param _amount amount to invest
    /// @param _type investment type
    /// @return investment id
    function invest(address _traderAddress, address _investorAddress, address _token, uint256 _amount, uint8 _type) 
        external
        returns (uint256);

    /// @dev Trader/Investor stops an investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _from initiator address
    /// @param _investmentId investment id
    function stop(address _traderAddress, address _investorAddress, address _from, uint256 _investmentId) 
        external;

    /// @dev Investor requests to exit an investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @param _value investment value
    function requestExitInvestor(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value) 
        external;
    
    /// @dev Trader requests to exit an investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @param _value investment value
    /// @param _amount transaction amount
    function requestExitTrader(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value, uint256 _amount) 
        external;

    /// @dev Approve exit of investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _signer Signer address
    /// @param _investmentId investment id
    /// @param _token token address
    /// @param _amount transaction amount
    function approveExit(address _traderAddress, address _investorAddress, address _signer, uint256 _investmentId, address _token, uint256 _amount) 
        external
        returns (uint256[3] memory);

    /// @dev Reject exit of investment
    /// @param _traderAddress trader address
    /// @param _investmentId investment id
    /// @param _value proposed investment value
    /// @param _from initiator address
    function rejectExit(address _traderAddress, uint256 _investmentId, uint256 _value, address _from)
        external;
}
