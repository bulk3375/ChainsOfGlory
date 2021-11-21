//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Characters  {
    //Stats of players and enemies
    struct Char_Stats {
        uint256 class;	        //Internal class 0 for player, index of enemies
        uint256 level;      	//By default is 0. Evolvable NFTs may upgrade this level
        uint256[10] stats;      //0-Health 1-Vitality 2-Attack 3-Defense 4-Mastery 5-Speed 6-Luck 7-Faith 8-reserved 9-reserved
        uint256[10] gear;       //0-Head 1-Neck 2-Chest 3-Belt 4-Legs 5-Feet 6-Arms 7-RHand (weapon) 8-LHand(complement) 9-Finger 10-Mount
    }

    //Used by _beforeTokenTransfer to catch the after minting
    Char_Stats private statsToMint;
    
    Char_Stats private statsFinal;
    
    mapping (address => uint256[]) gear;
    
    constructor()   {    }
    
    function mint(Char_Stats memory stats) public {
        statsToMint = stats;
        postMint();
    }
    
    function postMint() public {
        statsFinal = statsToMint;
        uint[] memory myArray = new uint[](3);
        myArray[0]=3; 
        myArray[1]=7; 
        myArray[2]=11; 
        gear[msg.sender]=myArray;
    }
    
    function changeArray() public {
        uint[] memory myArray = new uint[](5);
        myArray[0]=8; 
        myArray[1]=7; 
        myArray[2]=6; 
        myArray[3]=5; 
        myArray[4]=3; 
        gear[msg.sender]=myArray;
    }
    
    function addToArray() public {
        gear[msg.sender].push(23);
    }
    
    function removeFromArray(uint256 pos) public {
        gear[msg.sender][pos]=gear[msg.sender][gear[msg.sender].length-1];
        gear[msg.sender].pop();
    }
    
    
    function GetStats() public view returns (Char_Stats memory){
        return statsFinal;
    }
    
    function GetArray() public view returns (uint256[] memory){
        return gear[msg.sender];
    }
}