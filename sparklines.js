/* Sparklines.js */


var Sparkline = function(id,data,mixins) {
  this.background = 50;
  this.stroke = 230;
  this.percentage_color = "#5555FF";
  this.percentage_fill_color = 75;
  this.canvas = document.getElementById(id);
  this.data = data;
  this.top_padding = 10;
  this.bottom_padding = 10;
  this.left_padding = 10;
  this.right_padding = 10;
  this.percentage_lines = [0.5];
  this.fill_between_percentage_lines = true;

  this.parse_height = function(x) {
    /*  Parse height is used to find the height
     *  in an element of the Sparkline's data.
     *  For a simple array of heights like
     *      s = Sparkline('mycanvas', [1,2,3,4,5]);
     *  then this simple implementaiton is correct,
     *  but for more complex data formats you will
     *  need to override this method.
     * */
    return x;
  };

  this.calc_percentages = function() {
    var sum = 0;
    var l = this.data.length;
    var max = this.parse_height(this.data[0]);
    for (var i=0;i<l;i++) {
      var h = this.parse_height(this.data[i]);
      max = Math.max(max,h);
      sum += h;
    }
    var h = this.canvas.height - this.top_padding - this.bottom_padding;
    var avg = (sum*1.0) / l;

    var raws = [];
    for (var i=0;i<this.percentage_lines.length;i++) {
      var percent_line = this.percentage_lines[i];
      var percentage_height = h - (h * ((2 * avg * percent_line)/max)) + this.top_padding;
      raws.push(percentage_height);
    }
    return raws;
  };

  this.scale_height = function() {
    var l = this.data.length;
    var h = this.canvas.height - this.top_padding - this.bottom_padding;

    // Get maximum value.
    var max = this.parse_height(this.data[0]);
    for (var i=0; i<l;i++) {
      max = Math.max(max,this.parse_height(this.data[i]));
    }

    // Calculate raw heights based on percentage of max.
    var heights = [];
    for (var i=0; i<l;i++) {
      var percentage = (this.data[i] * 1.0) / max;
      var raw = h - (h * percentage) + this.top_padding;
      heights.push(raw);
    }
    return heights;
  };

  this.scale_width = function() {
    var w = this.canvas.width - this.left_padding - this.right_padding;
    var widths = [];
    var l = this.data.length;
    var segment_width = (w * 1.0) / (l-1);
    for (var i=0; i<l; i++) {
      widths.push((i*segment_width)+this.left_padding);
    }
    return widths;
  };
  this.scale_data = function() {
    var heights = this.scale_height();
    var widths = this.scale_width();
    var l = heights.length;
    var data = [];
    for (var i=0;i<l;i++)
      data.push({'y':heights[i], 'x':widths[i]});
    return data;
  };

  this.draw = function() {
    var sl = this;
    with(Processing(sl.canvas)) {
      setup = function() {};
      draw = function() {
	background(sl.background);
	scaled = sl.scale_data();
	var l = scaled.length;


	var percentages = sl.calc_percentages();
	if (sl.fill_between_percentage_lines && percentages.length > 1) {
	  noStroke();
	  fill(sl.percentage_fill_color);
	  var height = percentages[percentages.length-1] - percentages[0];
	  var width = scaled[l-1].x - scaled[0].x;
	  rect(scaled[0].x, percentages[0], width, height);

	}


	// Draw percentage lines.
	stroke(sl.percentage_color);
	for (var j=0;j<percentages.length;j++) {
	  var y = percentages[j];
	  line(scaled[0].x,y,scaled[l-1].x,y);
	}

	// Draw lines between data points.
	stroke(sl.stroke);
	for (var i=1; i<l;i++) {
	  var curr = scaled[i];
	  var previous = scaled[i-1];
	  line(previous.x,previous.y,curr.x,curr.y);
	}
	this.exit();
      };
      init();
    };
  };

  // Apply any overriding cust
  for (var property in mixins) {
    this[property] = mixins[property];
  };
};