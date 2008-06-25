/* Sparklines.js */


var BaseSparkline = function() {
  this.init = function(id,data,mixins) {
    this.background = 50;
    this.stroke = 230;
    this.percentage_color = "#5555FF";
    this.percentage_fill_color = 75;
    this.value_line_color = "#7777FF";
    this.value_line_fill_color = 85;
    this.canvas = document.getElementById(id);
    this.data = data;
    this.top_padding = 10;
    this.bottom_padding = 10;
    this.left_padding = 10;
    this.right_padding = 10;
    this.percentage_lines = [];
    this.fill_between_percentage_lines = false;
    this.value_lines = [];
    this.fill_between_value_lines = false;
    for (var property in mixins) this[property] = mixins[property];
  };

  /* Extracts height from a piece of data */
  this.parse_height = function(x) { return x; };
  this.heights = function() {
    return this.data.map(this.parse_height);
  };

  this.max = function() {
    var vals = this.heights();
    var max = vals[0];
    var l = vals.length;
    for (var i=0; i<l; i++) max = Math.max(max, vals[i]);
    return max;
  };
  this.scale_values = function(values, max) {
    if (!max) max = this.max();
    var h = this.canvas.height - this.top_padding - this.bottom_padding;
    var scale = function(x) {
      var percentage = (x * 1.0) / max;
      return h - (h * percentage) + this.top_padding;
    };
    return values.map(scale, this);
  };


  this.calc_value_lines = function() {
    var scaled = this.scale_values(this.value_lines);
    scaled.sort(function(a,b) { return a-b; });
    return scaled;
  };

  this.calc_percentages = function() {
    var sorted = this.heights();
    sorted.sort(function(a,b) { return a-b; });

    // Find data points at percentages.
    var points = [];
    var n = sorted.length;
    var l = this.percentage_lines.length;
    for (var i=0;i<l;i++) {
      var percentage = this.percentage_lines[i];
      var position = Math.round(percentage*(n+1));
      points.push(sorted[position]);
    }

    // Scale data points to size.
    var max = sorted[n-1];
    var raws = this.scale_values(points, max);
    raws.sort(function(a,b) { return a-b; });
    return raws;
  };

  this.scale_height = function() {
    return this.scale_values(this.heights());
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
	// Draw fill between percentage lines, if applicable.
	if (sl.fill_between_percentage_lines && percentages.length > 1) {
	  noStroke();
	  fill(sl.percentage_fill_color);
	  var height = percentages[percentages.length-1] - percentages[0];
	  var width = scaled[l-1].x - scaled[0].x;
	  rect(scaled[0].x, percentages[0], width, height);
	}

	var value_lines = sl.calc_value_lines();
	// Draw fill between value lines, if applicable.
	if (sl.fill_between_value_lines && value_lines.length > 1) {
	  noStroke();
	  fill(sl.value_line_fill_color);
	  var height = value_lines[value_lines.length-1] - value_lines[0];
	  var width = scaled[l-1].x - scaled[0].x;
	  rect(scaled[0].x, value_lines[0], width, height);
	}

	// Draw value lines.
	stroke(sl.value_line_color);
	for (var h=0;h<value_lines.length;h++) {
	  var y = value_lines[h];
	  line(scaled[0].x,y,scaled[l-1].x,y);
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
};

var Sparkline = function(id,data,mixins) {
  this.init(id,data,mixins);
}
Sparkline.prototype = new BaseSparkline();