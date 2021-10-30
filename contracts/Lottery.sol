// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;
pragma abicoder v1;

contract Lottery{
     address public manager;
     address [] public players;
     
     constructor() {
        manager  = msg.sender;
     }

     function enter() public payable {
         require(msg.value > .01 ether);
         players.push(msg.sender);
     }
     
     function random() private view returns (uint256){
       return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
     }
     
     function pickWinner() public payable admin{
        uint index = random() % players.length;
        payable(players[index]).transfer(address(this).balance);
        players = new address[](0);
     }
     
     modifier admin(){
          require(msg.sender == manager);
          _;
     }
     
     function getPlayers() public view returns (address[] memory){
         return players;
     }
}