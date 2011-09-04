
// Largely inspired by: http://www.coderholic.com/javascript-boids/

var BoidSet = function(boids, target){
  this.boids = boids;
  this.boidTarget =  target;
}

BoidSet.prototype.move = function (simulation){
  for(var i = 0; i < this.boids.length; i++) {
    this.boids[i].moveCloserToObject(this.boids, this.boidTarget, simulation);
    this.boids[i].moveAway(this.boids, 20, simulation);
  }
  for(var i = 0; i < this.boids.length; i++) {
    this.boids[i].move(simulation);
  }
}


var Target = function(name, x, y, attributes) {
  this.x = x;
  this.y = y;
  this.name = name;
  this.attributes = attributes;
  this.xVelocity = 1;
  this.yVelocity = -1;
}

Target.prototype.draw = function(paper,size){
  this.text = paper.text(this.x,this.y, this.name).attr({fill: '#FFFFFF'});
  this.text.attr({'font-size':30})
}

var Boid = function(x, y) {
  this.x = x;
  this.y = y;
  this.xVelocity = 0;
  this.yVelocity = 0;
}

Boid.prototype.draw = function(paper, size){
  this.circle = paper.circle(this.x, this.y, size).attr({fill: '#F2F5D7'});
}

Boid.prototype.move = function(simulation) {
  // RaphaÃ«l JS doesn't provide any way to GET the position once
  // we've moved it so we'll need to manually track the position
  originX = this.xVelocity;
  originY =  this.yVelocity;
  this.x += this.xVelocity;
  this.y += this.yVelocity;
  var border = 5;
  if(this.x <= border || this.x >= simulation.width - border) {
    this.x -= this.xVelocity;
    this.x = Math.max(this.x, border);
    this.x = Math.min(this.x, simulation.width - border);
    this.xVelocity = -this.xVelocity;
    this.x += this.xVelocity;
  }
  if(this.y <= border || this.y >= simulation.height - border) {
    this.y -= this.yVelocity;
    this.y = Math.max(this.y, border);
    this.y = Math.min(this.y, simulation.height - border);
    this.yVelocity = -this.yVelocity;
    this.y += this.yVelocity;
  }
  this.circle.translate(this.xVelocity, this.yVelocity);
}


Boid.prototype.distance = function(boid) {
  var distX = this.x - boid.x;
  var distY = this.y - boid.y;
  return Math.sqrt(distX * distX + distY * distY);
}

Boid.prototype.moveAway = function(boids, minDistance) {
  var distanceX = 0;
  var distanceY = 0;
  var numClose = 0;
  
  for(var i = 0; i < boids.length; i++) {
    var boid = boids[i];
    
    if(boid.x == this.x && boid.y == this.y) continue;
    
    var distance = this.distance(boid)
    if(distance < minDistance) {
      numClose++;
      var xdiff = (this.x - boid.x);
      var ydiff = (this.y - boid.y);
      
      if(xdiff >= 0) xdiff = Math.sqrt(minDistance) - xdiff;
      else if(xdiff < 0) xdiff = -Math.sqrt(minDistance) - xdiff;
      
      if(ydiff >= 0) ydiff = Math.sqrt(minDistance) - ydiff;
      else if(ydiff < 0) ydiff = -Math.sqrt(minDistance) - ydiff;
      
      distanceX += xdiff;
      distanceY += ydiff;
      boid = null;
    }
  }
  
  if(numClose == 0) return;
  
  this.xVelocity -= distanceX / 5;
  this.yVelocity -= distanceY / 5;
}

Boid.prototype.moveCloserToObject = function(boids, target) {
  if(boids.length < 1) return
  
  var avgX = 0;
  
  var avgY = 0;
  
  avgX += (this.x - target.x);
  
  avgY += (this.y - target.y);
  
  distance = this.distance(target)
  if(distance < 100) return;
  distance = distance * -0.1
  
  this.xVelocity= Math.min(this.xVelocity + (avgX / distance) * 1, 15)
  this.yVelocity = Math.min(this.yVelocity + (avgY / distance) * 1, 15)
  
}

var random = function(maxNum) {
  return Math.ceil(Math.random() * maxNum);
}


var FireflyGraph = function(data, totalBoids, boidDrawingFunction, targetDrawingFunction){
  this.data = data;
  this.boidPool = totalBoids;
  this.allBoids = []
  this.boidSets = []
  this.targets = []
  this.elem = $("#boids");
  this.width = window.innerWidth;
  this.height = 400;
  this.elem.html("<div id='boids-canvas' style='margin: auto; background: #040826; width:" + this.width + "px; height:" + this.height + "px;'></div>");
  this.paper = Raphael("boids-canvas", this.width, this.height);
}

FireflyGraph.prototype.findTargetByName = function(name){
  for(var i=0; i < this.targets.length; i++){
    if (this.targets[i].name == name){
      return this.targets[i];
    }
  }
}


FireflyGraph.prototype.moveToTimePoint = function(forDataPoint){
  var newBoidSets = [];
  var newAllBoids = []
  for(var i=0; i < this.data[forDataPoint].length; i++){
    var boids = []
    for(var k = 0; k < (this.data[forDataPoint][i].count/totalCount)*this.boidPool; k++) {
      b = this.allBoids.pop()
      boids.push(b);
      newAllBoids.push(b)
    }
    var target = this.findTargetByName(this.data[forDataPoint][i].title)
    newBoidSets.push(new BoidSet(boids, target))
  }
  this.boidSets = newBoidSets;
  this.allBoids = newAllBoids;
}

FireflyGraph.prototype.setupForDataPoint = function(forDataPoint){
  this.calucateCountForDataPoint(forDataPoint);
  this.createBoidSets(forDataPoint);
}

FireflyGraph.prototype.createBoidSets = function(forDataPoint){
  for(var i=0; i < this.data[forDataPoint].length; i++){
    var boids = []
    for(var k = 0; k < (this.data[forDataPoint][i].count/totalCount)*this.boidPool; k++) {
      b = new Boid(random(this.width), random(this.height), 5)
      b.draw(this.paper, 5)
      this.allBoids.push(b)
      boids.push(b);
    }
    var target = new Target(this.data[forDataPoint][i].title, 300 * (i+1) , 200 , {title:this.data[forDataPoint][i].title})
    this.targets.push(target)
    target.draw(this.paper, 100, target.attributes)
    this.boidSets.push(new BoidSet(boids, target))
  }
}

FireflyGraph.prototype.run = function(forDataPoint){
  if(forDataPoint){
    this.setupForDataPoint(forDataPoint);
  }
  else{
    this.setupForDataPoint(0);
  }
}

FireflyGraph.prototype.moveBoids = function() {
  for(var i=0; i< this.boidSets.length; i++){
    this.boidSets[i].move(this);
  }
  setTimeout("graph.moveBoids();", 10);
};

FireflyGraph.prototype.calucateCountForDataPoint = function(index){
  this.totalCount = 0
  for(var i=0; i < this.data[index].length; i++){
    this.totalCount = totalCount = this.totalCount + this.data[index][i].count;
  }
}

//A new graph is created thus. Each array represents a data set, which can be move to by calling moveToTimePoint(i)
$(document).ready(function () {
  graph = new FireflyGraph([
    [{title:"dr who", count: 90}, {title:"question time", count:20}, {title:"bbc news", count:10} ],
    [{title:"dr who", count: 10}, {title:"question time", count:90}, {title:"bbc news", count:20}],
    [{title:"dr who", count: 60}, {title:"question time", count:30}, {title:"bbc news", count:30}]
    ], 120);
    graph.run();
    graph.moveBoids();
    
  });