// Last updated: 9th June 2002

// returns an array of arrays representing standard tetris block shapes
// 0 represents an empty square and any other number is a different colour of tile;
function getStandardBlocks() {
	//
	var l = [
		[0,0,1],
		[1,1,1]
	];
	l.boxBottom = 1; // defines that rotationBoxBottom should be heightOfArray+1
	//
	var f = [
		[2,0,0],
		[2,2,2]
	];
	f.boxBottom = 1;
	//
	var s = [
		[0,3,3],
		[3,3,0]
	];
	s.boxBottom = 1;
	//
	var z = [
		[4,4,0],
		[0,4,4]
	];
	z.boxBottom = 1;
	//
	var o = [
		[5,5],
		[5,5]
	];
	//
	var t = [
		[0,6,0],
		[6,6,6]
	];
	t.boxBottom = 1;
	//
	var i = [
		[7,7,7,7]
	];
	i.boxTop = -1;
	i.boxBottom = 2;
	//
	return new Array(l,f,s,z,o,t,i);
}