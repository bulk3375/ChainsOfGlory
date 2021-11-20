//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "./RoyaltyERC721.sol";
import "./TokenERC20.sol";

contract ChainsOfGlory is AccessControlEnumerable, Ownable {

   
    AggregatorV3Interface internal priceFeed;
    int latestPrice;               //Latest price of Matic taken
    uint public lastTimeStamp;     //Internal use as timer
    uint public interval;          //Number of seconds between reads
    uint public decimals;          //Number of decimals in the price    

    TokenERC20 internal _gameToken;  //Address of game token SC
    RoyaltyERC721 internal _gameNFT;      //Address of game NFT SC
    
    //Tokenomics
    address internal _creators;     //Address of the game creators
    address internal _developers;   //Address of the game developers
    address internal _reserve;      //Address of the game reserve
    uint constant crebp = 30;       //Creators percentage basic points
    uint constant devbp = 20;       //Developers percentage basic points
    uint constant resbp = 50;       //Reserve percentage basic points
    
    uint public gamePrice;          //Number of decimals in the price
   
    constructor(address creators, address developers, address reserve) {

        //Upon creation the addresses of creators, developers and reserve are set and cannot be changed never ever
        //Periodically, those addresses may pake the correspondant percentage of incomes
        //
        _creators=creators;
        _developers=developers;
        _reserve=reserve;

        //REMEMBER TO USE THE APROPRIATE ADDRESS HERE!!!
        priceFeed = AggregatorV3Interface(0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada);

        lastTimeStamp = block.timestamp;
        interval=600; //By default 600 secs
        latestPrice=getLatestPrice();
        decimals=8;     //By default decimals provided by chainlink are 8, but... well who knows

        gamePrice=20;   //Initially 20 USD
    }

    //Buy Player SIMPLE => REFINE!!
    function BuyPlayer() public payable {
        latestPrice=getLatestMaticUSD();
        uint gamePriceMatic = gamePrice * (10 ** (18-decimals)) * uint(latestPrice);
        require (msg.value >= gamePriceMatic, "BuyPlayer: not enough Matic sent");
        _gameNFT.mint(msg.sender, 0);
        
        /*
        uint moneyToReturn = msg.value - gamePriceMatic; 
        if(moneyToReturn > (0.001 * 10 ** decimals))
            msg.sender.transfer(moneyToReturn);
        */
    }

    function CalculateGamePriceInLocal() public view returns (uint) {
        int locp =getLatestPrice();
        return gamePrice * (10 ** (18-decimals)) * uint(locp);
    }

    //ets the game price in dollars
    function SetGamePrice(uint price) public onlyOwner {
        gamePrice=price;
    }
    //Read the Matic/USD feed each 'intv' seconds
    function SetInterval(uint intv) public onlyOwner {
        interval=intv;
    }

    //Read the Matic/USD feed each 'intv' seconds
    function SetDecimals(uint dec) public onlyOwner {
        decimals=dec;
    }

    //Game Token Address
    function SetGameToken(address gameToken) public onlyOwner {
        _gameToken=TokenERC20(gameToken);
    }

    //Game NFT Address
    function SetGameNFT(address gameNFT) public onlyOwner {
        _gameNFT=RoyaltyERC721(gameNFT);
    }

     /**
     * Returns the latest price based on a time interval
     */
    function getLatestMaticUSD() internal returns (int) {

        if((block.timestamp - lastTimeStamp) < interval && latestPrice!=0)
            return latestPrice;

        lastTimeStamp = block.timestamp;
        latestPrice=getLatestPrice();
        return latestPrice;
    }

    //Standard feed call
    function getLatestPrice() public view returns (int) {        
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
}