/* Sparklines.js */


var BaseSparkline = function() {
  this.init = function(id,data,mixins) {
    this.background = 50;
    this.stroke = "rgba(230,230,230,0.70);";
    this.percentage_color = "#5555FF";
    this.percentage_fill_color = 75;
    this.value_line_color = "#7777FF";
    this.value_line_fill_color = 85;
    this.canvas = document.getElementById(id);
    this.data = data;
    this.scale_from_zero = true;
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
    for (var i=1; i<l; i++) max = Math.max(max, vals[i]);
    return max;
  };
  this.min = function() {
    var vals = this.heights();
    var min = vals[0];
    var l = vals.length;
    for (var i=1; i<l; i++) min= Math.min(min, vals[i]);
    return min;
  };
  this.height = function() {
    return this.canvas.height - this.top_padding - this.bottom_padding;
  };
  this.width = function() {
    return this.canvas.width - this.left_padding - this.right_padding;
  };
  this.scale_values = function(values, max) {
    if (!max) max = this.max();
    var p = this.top_padding;
    var h = this.height();
    var scale;
    if (this.scale_from_zero == true) {
      scale = function(x) {
	var percentage = (x * 1.0) / max;
	return h - (h * percentage) + p;
      };
    }
    else {
      var min = this.min();
      var value_range = max - min;
      scale = function(x) {
	var percentage = ((x-min)*1.0) / value_range;
	return h - (h * percentage) + p;
      };
    }
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

  this.segment_width = function() {
    var w = this.width();
    var l = this.data.length;
    return (w * 1.0) / (l-1);
  };
  this.scale_width = function() {
    var widths = [];
    var l = this.data.length;
    var segment_width = this.segment_width();
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

var BarSparkline = function(id,data,mixins) {
  this.marking_padding = 5;
  this.padding_between_bars = 5;
  this.extend_markings = true;
  this.init(id,data,mixins);
  this.segment_width = function() {
    var l = this.data.length;
    var w = this.width();
    return ((w * 1.0) - ((l-1) * this.padding_between_bars)) / l;
  };
  this.scale_width = function() {
    var widths = [];
    var l = this.data.length;
    var segment_width = this.segment_width();
    for (var i=0; i<l; i++) {
      widths.push((i*segment_width)+(this.padding_between_bars*i)+this.left_padding);
    }
    return widths;
  };

  this.draw = function() {
    var sl = this;
    with(Processing(sl.canvas)) {
      draw = function() {
	background(sl.background);
	var scaled = sl.scale_data();
	var l = scaled.length;
	var sw = sl.segment_width();
	var gap = sl.padding_between_bars;
	var mp = sl.marking_padding;


	// Draw fill between value lines (if applicable).
	var value_lines = sl.calc_value_lines();
	if (sl.fill_between_value_lines && value_lines.length > 1) {
	  noStroke();
	  fill(sl.percentage_fill_color);
	  var height = value_lines[value_lines.length-1] - value_lines[0];
	  var width = scaled[l-1].x - scaled[0].x + sw;
	  if (sl.extend_markings) {
	    width += 2 * mp;
	    rect(scaled[0].x - mp, value_lines[0], width, height);
	  }
	  else rect(scaled[0].x, value_lines[0], width, height);
	}

	// Draw value lines.
	stroke(sl.value_line_color);
	for (var h=0;h<value_lines.length;h++) {
	  var y = value_lines[h];
	  if (sl.extend_markings) {
	    line(scaled[0].x - mp,y,scaled[l-1].x+ mp + sw,y);
	  }
	  else line(scaled[0].x,y,scaled[l-1].x+sw,y);
	}

	// Draw fill between percentage lines (if applicable).
	var percentages = sl.calc_percentages();
	if (sl.fill_between_percentage_lines && percentages.length > 1) {
	  noStroke();
	  fill(sl.percentage_fill_color);
	  var height = percentages[percentages.length-1] - percentages[0];
	  var width = scaled[l-1].x - scaled[0].x + sw;
	  if (sl.extend_markings) {
	    width += 2 * mp;
	    rect(scaled[0].x - mp, percentages[0], width, height);
	  }
	  else rect(scaled[0].x, percentages[0], width, height);
	}
	// Draw percentage lines.
	stroke(sl.percentage_color);
	for (var j=0;j<percentages.length;j++) {
	  var y = percentages[j];
	  if (sl.extend_markings) {
	    line(scaled[0].x - mp,y,scaled[l-1].x+ mp + sw,y);
	  }
	  else line(scaled[0].x,y,scaled[l-1].x+sw,y);
	}

	// Draw bars.
	stroke(sl.stroke);
	fill(sl.stroke);
	var width = sl.segment_width();
	var height = sl.height();
	for (var i=0;i<l;i++) {
	  var d = scaled[i];
	  rect(d.x,d.y,width,height-d.y);

	};
	this.exit();
      };
      init();
    };
  };


}
BarSparkline.prototype = new BaseSparkline();