//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library StatsAndSlots {
    
    //Stats index
    uint public constant Health=0;
    uint public constant Vitality=1;
    uint public constant Attack=2;
    uint public constant Defense=3;
    uint public constant Mastery=4;
    uint public constant Speed=5;
    uint public constant Luck=6;
    uint public constant Faith=7;

    //Slor index
    uint public constant Head=0;
    uint public constant Neck=1;
    uint public constant Chest=2;
    uint public constant Belt=3;
    uint public constant Legs=4;
    uint public constant Feet=5;
    uint public constant Arms=6;
    uint public constant RHand=7;
    uint public constant LHand=8;
    uint public constant Finger=9;
    uint public constant Mount=10;
}