/*	Comment Block:
	Written by Gaven Cox with assistance from Daniel Paquette,
	Emily Marceau, and Sasha Rudyakov. This program uses the 
	"hull.js" and "JSON" javascript modules.
	
	The current iteration of this program requires an input as
	an ordered array, where each member of that array is a 
	coordinate in two dimensions, which is defined as 
	"originPoints", with an example array being given. Future
	iterations of this program would extend functionality to
	read from a geojson file instead. 
	
	As an output, the program will return a "concave hull", or 
	"catenary hull" based off of the input as a geojson file 
	named "output.geojson" in the user's current directory. 
	
	To display this array in console instead, or the result of 
	any intermediate steps, one may use the "statusReport" 
	function, which will be described in further detail near the 
	end of this file.

*/

//	Module and general requirements:
var http = require('http');
var hull = require('./hull.js');
var fs = require('fs');
//var JSON = require('JSON');

/*	Comment Block:
	This marks the beginning of the body of code. Note that the code
	is broken up into several smaller functions - I hope that this
	make maintaining and continued work easier.
*/
	
var server = http.createServer(function(req, res) {

/*	Comment Block:
	This array serves as the current input, and would need to be edited
	directly in the code's current form. Future might include parsing a 
	geojson directly and returning the ordered set of border points here.
*/

  var originPoints = [[0, 0], [0, 5], [.5,4],[1,3.4],[3, 3],[5, 2],[6,3],
					[7,3.5],[8,4],[10,6],[10,0],[5, 1],[4,1]];

/*	Comment Block:
	This is the "alpha value" used to construct the catenaries. As such,
	a higher value for origAlpha will return a more curved shape, while
	a value of 0 will return a polygon - in fact, an alpha of 0 should
	return exactly the convex hull, as per the initial guidelines. Note
	that negative values will return a "bubbled" shape, or one where
	previously concave regions bubble outward instead. While this feature
	is not necessary for the project, I am inclined to believe that it is
	really friggin cool.
	
	While this value currently needs to be changed manually, one might
	expand on this program by allowing this value as a user input.
*/

  var origAlpha = .1;
  var length = originPoints.length
  var alpha = origAlpha;
  var originPoints1 = originPoints.slice();
  originPoints1.push(originPoints1[0]);
  var hullPoints = `${hull(originPoints)}`
  var hullArray = hullPoints.split(",");
  var counter = 0
  var curPoint = [];
  var result = [];
  var lastResult = [];
  var E = 2.71828;

/*	Comment Block:
	This function can be used to output the original points
	(originPoints) as a file named "input.geojson" in the current 
	directory.
*/

function outputInput() {
  input = [];
  originPoints.forEach(function(point) {
	  input.push(JSON.stringify(point));
  });
  output = ('{\n  "type": "Polygon",\n  "coordinates": [\n'+input+'\n  ]\n}');
  fs.writeFile('input.geojson',output,(err) => {
	if (err) throw err;
	console.log('\nInput saved!');
  }); 
}

/*	Comment Block:
	This is a helper function to keep track of indexes.
*/

hullArray.forEach(function(point) {
	  if (counter%2 === 0) {
		  curPoint.push(parseFloat(point));
	  }
	  else {
		  curPoint.push(parseFloat(point));
		  result.push(curPoint);
		  curPoint = [];
	  }
	  counter++
  });
res.writeHead(200);

/*	Comment Block:
	This function will round a value to a number of decimal points
	specified by decimals. Apparently Javascript doesn't have a
	rounding function built in. Interesting.
*/

function round(value, decimals) {
    roundNum = Number(Math.round(value+'e'+decimals)+'e-'+decimals);
	if (isNaN(roundNum)){
		return 0;
	} else {
		return roundNum;
	}
}

/*	Comment Block:
	This function determines the differences between your original
	set of points and the convex hull and returns those differences,
	as only locally concave regions will need to be curved inward.
	
	Note that this function currently requires the first point to be
	a member of the convex hull in order to function properly. Future
	work may include fixing this issue so that any input will work
	properly.
*/

function concaveRegion() {
	var original = originPoints1.slice();
	var finalResult = [];
	var component = [];
	var searching = false;
	var starting = false;
	var lastPointSeen = [];

	original.forEach(function(point) {
		if (contains(point) && !starting) {
			starting = true;
			lastPointSeen = point;
		}
		else if (!contains(point) && !starting) {
			original.push(point);
		}
		else if (!contains(point) && searching) {
			component.push(point);
		}
		else if (!contains(point) && !searching) {
			searching = true;
			component = [];
			component.push(lastPointSeen);
			component.push(point);
		}
		else if (contains(point) && searching) {
			searching = false;
			component.push(point);
			finalResult.push(component);
			component = [];
		}
		else {
			lastPointSeen = point;
		}
	});
	lastResult.push(finalResult)
	return finalResult;
}

startingPoints = concaveRegion();

/*	Comment Block:
	Helper function to determine if a point is contained in an array
	and return a boolean.
*/

function contains(point) {
	var value = false;
	
	result.forEach(function(p) {
		if (p.toString() == point.toString()) {
			value = true;
		}
	});
	return value;
}

/*	Comment Block:
	This function was intended to find an index at which to start,
	which would relax the constraint of needing your first point to 
	be within the convex hull. Future work might include adding a
	mod function to the indexes for the concaveRegion function and
	uncommenting this block of code.
*/

/*function helperFunc(startIndex) {
	  var start = startIndex;
	  var results = [];
	  var component = [];
	  // checks if the point exists
	  for (var i = 0; i < result.length; i++) {
		  if ((result[i].toString() == originPoints[(start % \
		  originPoints.length)].toString()) || 
			(result[i].toString() == originPoints[Math.abs((start-2) % 
			originPoints.length)].toString())){
				  // do nothing
				  start += 1;
			  }
			  else {
				  var finished = false;
				  while(!finished) {
						  if ((result[i].toString() != originPoints[(start %
						  originPoints.length)].toString()) && 
							(result[i].toString() != 
							originPoints[Math.abs((start-2) % 
							originPoints.length)].toString())){
							component.push(originPoints[(start % 
							originPoints.length)]);
							start += 1;
						  }
						  else {
							  results.push(component);
							  component = [];
							  start += 1;
							  finished = true;
						  }
				  }
			  }			  
		  }
	  return results;
  }  */

/*	Comment Block:
	This is the basic hyperbolic cosine function.
*/

function cosh(x) {
	  return ((Math.pow(E,x)+Math.pow(E,-1*x))/2.0);
  }

/*	Comment Block:
	This is the basic, unscaled catenary function. Note that this
	subtracts a constant such that cat(1) and cat(-1) will return
	0.
*/
  
function cat(x) {
	return ((cosh(x))-(cosh(-1)));
}

/*	Comment Block:
	This will return the set of 100 points along the catenary
	function, which is scaled by the alpha value given near the
	start of the program.
*/
  
function catenary(alpha) {
	  var result = [];
	  
	  for(var i = -1; i < 1.02; i = i + 0.02) {
		  var point = [];
		  point.push(round(i,4));
		  var catPoint = (round(alpha*cat(i),4));
		  point.push(catPoint);
		  result.push(point);
	  }
	  return result;
  }

/*	Comment Block:
	This will return the set of 200 points along the scaled
	catenary function, just in the opposite order. This is used 
	when returning a catenary along the bottom of the shape in
	order to keep the correct ordering of the points. Note that
	there were probably easier ways to implement this rather than
	recalculating it.
*/

function backwardsCatenary(alpha) {
	  var result = [];
	  
	  for(var i = -1; i < 1.02; i = i + 0.02) {
		  var point = [];
		  point.push(round(-i,4));
		  var catPoint = (round(alpha*cat(i),4));
		  point.push(catPoint);
		  result.push(point);
	  }
	  return result;
  }

/*	Comment Block:
	This function returns the angle at which to rotate an array
	of points in order to make the last point and the first point
	have the same y-values.
*/
  
function getThetas(pointArray) {
	  var points = pointArray;
	  var result = [];
	  points.forEach(function(point) {
		  var slope = -(point[point.length -1][1] - point[0][1]) / 
						(point[point.length -1][0] - point[0][0]);
		  result.push(round((Math.atan(slope)),5));
	  });
	  return result;
  }

/*	Comment Block:
	This function uses a rotation matrix to rotate a region
	(given by pointArray) by some angle (which is given by 
	the corresponding value in thetaArray).
*/

function getRotate(thetaArray,pointArray) {
	  var thetas = thetaArray;
	  var points = pointArray;
	  var result = [];
	  i=0;
	  points.forEach(function(hull) {
		  var rotateHull = [];		  
		  hull.forEach(function(point) {		  
			  var newPoint = [round((point[0]*Math.cos(thetas[i]) - 
			  (point[1]*Math.sin(thetas[i]))),4),
			  round((point[0]*Math.sin(thetas[i]) + 
			  (point[1]*Math.cos(thetas[i]))),4)];
			  rotateHull.push(newPoint);
		  });
		  result.push(rotateHull);
		  i=i+1;
	  });
	  return result;
  }

/*	Comment Block:
	This function finds scalars which will be used in order to scale
	a region such that the endpoints lie on 1 and -1. As such, this
	function returns an array including the width scalar, the midpoint,
	the furthest y value from y = 0, whether the points are upside-down,
	and whether the points are backwards.
*/

function getScalars(rotateArray) {
	var points = rotateArray;
	var result = [];
	points.forEach(function(hull) {
		var upsideDown = 1;
		var backwards = 1;
		var evilExes = [];
		var evilWhys = [];
		hull.forEach(function(point) {
			evilExes.push(point[0]);
			evilWhys.push(point[1]);
		});
		if ((evilWhys[0]-evilWhys[1])< 0) {
			upsideDown = -1;
		};
		if ((evilExes[0]-evilExes[evilExes.length])> 0) {
			backwards = -1;
		};
		var lowestX = Number.POSITIVE_INFINITY;
		var highestX = Number.NEGATIVE_INFINITY;
		var lowestY = Number.POSITIVE_INFINITY;
		var highestY = Number.NEGATIVE_INFINITY;
		var tmp;
		for (var i=evilExes.length-1; i>=0; i--) {
			tmp = evilExes[i];
			if (tmp < lowestX) lowestX = tmp;
			if (tmp > highestX) highestX = tmp;
		}
		for (var i=evilWhys.length-1; i>=0; i--) {
			tmp = evilWhys[i];
			if (tmp < lowestY) lowestY = tmp;
			if (tmp > highestY) highestY = tmp;
		}
		if (upsideDown == 1) {
			var farY = highestY;
		} else {
			var farY = lowestY;
		}
		result.push([((highestX-lowestX)/2),((highestX+lowestX)/2),
		farY,upsideDown,backwards]);
	});
	return result;
}

/*	Comment Block:
	This function scales a rotated set of points such that the end
	points lie on 1 and -1, which is accomplished by taking in various
	scalars found using the previous function.
*/

function getScaleDown(rotateArray,scalarArray) {
	var points = rotateArray;
	var scalars = scalarArray;
	var result = [];
	i=0;
	points.forEach(function(hull) {
		scaleDownHull = [];
		hull.forEach(function(point) {
			scaleDownHull.push([round(((point[0]-scalars[i][1])/
			scalars[i][0]),4),round((scalars[i][3]*((point[1]-
			scalars[i][2])/scalars[i][0])),4)]);
		});
		i=i+1;
		result.push(scaleDownHull);
	});
	return result;
}

/*	Comment Block:
	This function will scale a catenary up back to the same size
	and location of the original concave region which it replaced.
	Note that all concave regions should be scaled, implying that
	we we only ever need to scale up a catenary rather than any
	normal set of points.
*/
  
function getScaleUp(cat,scalarArray) {
	var points = cat;
	var scalars = scalarArray;
	var result = [];
	i=0;
	points.forEach(function(hull) {
		scaleUpHull = [];
		hull.forEach(function(point) {
			scaleUpHull.push([round(((scalars[i][0]*point[0])+
			scalars[i][1]),4),round((scalars[i][3]*((scalars[i][0]*
			point[1])+scalars[i][2])),4)]);
		});
		i=i+1;
		result.push(scaleUpHull);
	});
	return result;
}

/*	Comment Block:
	This function takes in the scaled up set of points and re-rotates
	them to their original configuration.
*/
  
function getUnRotate(scaledUp,thetaArray) {
	  var thetas = thetaArray;
	  var points = scaledUp;
	  var result = [];
	  i=0;
	  points.forEach(function(hull) {
		  var unRotateHull = [];
		  hull.forEach(function(point) {
			  var newPoint = [round((point[0]*Math.cos(-1*thetas[i]) - 
			  (point[1]*Math.sin(-1*thetas[i]))),4),
			  round((point[0]*Math.sin(-1*thetas[i]) + 
			  (point[1]*Math.cos(-1*thetas[i]))),4)];
			  unRotateHull.push(newPoint);
		  });
		  result.push(unRotateHull);
		  i=i+1;
	  });
	  return result;
  }

/*	Comment Block:
	This is a wrapper function which takes in a concave region and returns
	a catenary for that region using the other functions.
*/
  
function getFinal(pointArray) {
	return getUnRotate(getScaleUp(getCat(getScaleDown(getRotate(getThetas(pointArray),
	pointArray),getScalars(getRotate(getThetas(pointArray),pointArray))),
	getScalars(getRotate(getThetas(pointArray),pointArray))),
	getScalars(getRotate(getThetas(pointArray),pointArray))),
	getThetas(pointArray));
}  

/*	Comment Block:
	This function takes in the fully scaled and rotated array, which
	is to say a set of points ranging between -1 and 1 such that all
	points are below or on the x-axis, and checks to see if any points
	are above the catenary function. If no, it returns the set of 
	points along the catenary. Else, it finds the point which is the
	furthest above the catenary, which is to say that it has the
	largest difference in y-values, and recursively calls itself on
	each of those sets of points until all points pass.
	
	Note that this step could potentially take up to n^2 algorithmic
	time to complete, as one may need to rescale all points for each
	point. That being said, this would only be the case if every point
	were to fail the above/below catenary test - which is silliness.
	In fact, one expects there to be at most a small handful of
	exceptions before the catenaries naturally terminate. In fact, if
	one were to restrict the alpha value to be at least greater than
	some constant (.01, for example, produces what is essentially a 
	line), then, in fact, the function could be guaranteed to terminate
	within n*log(n) time.
*/

function getCat(scaleDownArray,scalarArray) {
	var points = scaleDownArray;
	var scalars = scalarArray;
	var result = [];
	i=0;
	b=0;
	points.forEach(function(hull) {
		var largestDiff = 0;
		var diffIndex = 0;
		hull.forEach(function(point) {
			for (var i=0; i <= point.length; i++) {
				tmp = point[1] - alpha*cat(point[0]);
				if (tmp > largestDiff) {
					largestDiff = tmp;
					diffIndex = i;
				};
			};
		});
		if (largestDiff == 0) {
			if (scalars[b][3] == -1) {
				result.push(backwardsCatenary(alpha));
			} else {
				result.push(catenary(alpha));				
			}
 		} else if (((hull.slice(0,diffIndex)).length > 0)||
		((hull.slice(diffIndex)).length > 0)) {
			alpha = .5*alpha;
			console.log(alpha);
			if ((hull.slice(0,diffIndex)).length > 0){
				tmpArray = [];
				tmpArray.push(hull.slice(0,diffIndex));
				result.push(getFinal(tmpArray));
			}
			if ((hull.slice(diffIndex)).length > 0){
				tmpArray = [];
				tmpArray.push(hull.slice(diffIndex));
				result.push(getFinal(tmpArray));
			} 
		} else {
			result.push(hull);
	};
	b = b + 1;
	});
	return result;	
}

/*	Comment Block:
	This function concatenates our sets of points to create our final
	set of points (specifically, it concatenates the points within our
	sets of points).
	
	Note that this currently does not push the original set of points -
	if order does not matter then one might also push the convex hull,
	else, one may expand on this program by allowing for convex regions
	which are not necessarily lines.
*/

function getCatHull(pointArray) {
	var points = getFinal(pointArray);
	var convexHull = result;
	var catHull = [];
	points.forEach(function(hull) {
		hull.forEach(function(point) {
			catHull.push(point);
		});
	});
	return catHull;
}

/*	Comment Block:
	This function was used during testing, but has been kept for ease
	of maintenance or expansion. This will return outputs for any
	intermediate steps (which are currently left without argument).
*/

function statusReport() {
  console.log('\n Catenary Points:\n');  
  console.log(catenary(alpha));
  
  console.log('\n Original Points:\n');  
  console.log(originPoints);
  
  console.log('\n Convex Hull Points:\n');  
  console.log(result);
  
  console.log('\n Concave Regions:\n');
  console.log(startingPoints);
  
  console.log('\n Rotation Angle for Concave Regions:\n');  
  console.log(getThetas());	  
  
  console.log('\n Rotated Concave Regions:\n');  
  console.log(getRotate());
  
  console.log('\n Scalars and Centers:\n');  
  console.log(getScalars()); 
  
  console.log('\n Scaled Down and Centered:\n');  
  console.log(getScaleDown());
  
  console.log('\n Catenary Points:\n');  
  console.log(getCat()); 
  
  console.log('\n Scaled Up and Centered:\n');  
  console.log(getScaleUp());
  
  console.log('\n Unrotated Regions:\n');  
  console.log(getUnRotate());
  
  }  

/*	Comment Block:
	Refer to previous comments for full descriptions of these functions,
	which have been commented out as they are not necessary for the
	final project.
*/
    
  //statusReport();
  //outputInput();

/*	Comment Block:
	The rest of the code will run the program and format it as a 
	geojson. The algorithm is also timed, with the total run-time
	as the "time" variable.
*/

  var start = new Date().getTime();
  output = ('{\n  "type": "Polygon",\n  "coordinates": [\n'+
  JSON.stringify(getCatHull(startingPoints))+'\n  ]\n}');
  fs.writeFile('output.geojson',output,(err) => {
	if (err) throw err;
	//console.log('Output saved!');
  });
  var end = new Date().getTime();
  var time = end - start;

/*	Comment Block:
	These statements will print to the console the running time of
	algorithm, the number of points which were originally input,
	and the amount of time which the algorithm took per point. While
	this was not necessary as per the project guidelines, this would
	certainly be useful to gain an understanding of the expected run-
	time, which would be a requirement if this program were to be
	considered for evaluating nontrivial amount of points.
*/

/*	Run-Time Outputs:  
  console.log('\nTotal Time Taken: ',time,' milliseconds');
  console.log('Number of Original Points: ',length);
  console.log('Time Per Point: ',time/length,' milliseconds');
*/

  res.end();
});
server.listen(8080);

