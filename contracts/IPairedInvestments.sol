// "SPDX-License-Identifier: UNLICENSED"
pragma solidity >=0.4.21 <0.7.0;

interface IPairedInvestments {

    /// @dev New investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _token token address
    /// @param _amount amount to invest
    /// @param _investorProfitPercent percentage profit for investor
    /// @param _type type of investment
    /// @return investment id and start date
    function invest(address _traderAddress, address _investorAddress, address _token, uint256 _amount, uint16 _investorProfitPercent,
            uint8 _type) 
        external 
        returns(uint256, uint256);

    /// @dev Stop investment
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @return end date
    function stop(address _traderAddress, address _investorAddress, uint256 _investmentId) 
        external 
        returns (uint256);

    /// @dev Investor requests investment exit
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @param _value investment value
    function requestExitInvestor(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value) 
        external;

    /// @dev Trader requests investment exit
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _investmentId investment id
    /// @param _value investment value
    /// @param _amount transaction amount
    function requestExitTrader(address _traderAddress, address _investorAddress, uint256 _investmentId, uint256 _value, uint256 _amount) 
        external;

    /// @dev Approve investment exit
    /// @param _traderAddress trader address
    /// @param _investorAddress investor address
    /// @param _signer Signer address
    /// @param _investmentId investment id
    /// @param _amount transaction amount
    /// @return array with: trader payout, investor payout, fee payout, original investment amount
    function approveExit(address _traderAddress, address _investorAddress, address _signer, uint256 _investmentId, uint256 _amount) 
        external  
        returns (uint256[5] memory);

    /// @dev Reject an exit request
    /// @param _traderAddress trader address
    /// @param _investmentId investment id
    /// @param _value proposed investment value
    function rejectExit(address _traderAddress, uint256 _investmentId, uint256 _value) 
        external;


    /// @dev Calculate investment profits and fees
    /// @param _value investment value
    /// @param _amount original investment amount
    /// @param _traderFeePercent trader fee percent
    /// @param _investorFeePercent investor fee percent
    /// @param _investorProfitPercent investor profit percent
    /// @return array with: trader fee, investor fee, trader profit, investor profit
    function calculateProfitsAndFees(
		uint256 _value,
		uint256 _amount,
		uint256 _traderFeePercent,
		uint256 _investorFeePercent,
		uint256 _investorProfitPercent
	) 
        external 
        pure 
        returns (uint256, uint256, uint256, uint256);
}