/* Sparklines.js */

//This prototype is provided by the Mozilla foundation and
//is distributed under the MIT license.
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}


var BaseSparkline = function() {
  this.init = function(id,data,mixins) {
    this.background_color = 50;
    this.line_color = "rgba(230,230,230,0.70);";
    this.percentile_line_color = "#5555FF";
    this.percentile_fill_color = 75;
    this.value_line_color = "#7777FF";
    this.value_line_fill_color = 85;
    this.canvas = document.getElementById(id);
    this.data = data;
    this.scale_from = undefined;
    this.scale_to = undefined;
    this.top_padding = 10;
    this.bottom_padding = 10;
    this.left_padding = 10;
    this.right_padding = 10;
    this.percentile_lines = [];
    this.fill_between_percentile_lines = false;
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
    var top = (this.scale_to != undefined) ? this.scale_to : max;
    var bottom = (this.scale_from != undefined) ? this.scale_from : this.min();
    var range = Math.abs(top - bottom);
    var scale = function(x) {
      var percentage = ((x-bottom)*1.0) / range;
      return h - (h * percentage) + p;
    };
    return values.map(scale, this);
  };


  this.calc_value_lines = function() {
    var scaled = this.scale_values(this.value_lines);
    scaled.sort(function(a,b) { return a-b; });
    return scaled;
  };

  this.calc_percentiles = function() {
    var sorted = this.heights();
    sorted.sort(function(a,b) { return a-b; });

    // Find data points at percentages.
    var points = [];
    var n = sorted.length;
    var l = this.percentile_lines.length;
    for (var i=0;i<l;i++) {
      var percentage = this.percentile_lines[i];
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
	background(sl.background_color);
	scaled = sl.scale_data();
	var l = scaled.length;

	var percentiles = sl.calc_percentiles();
	// Draw fill between percentile lines, if applicable.
	if (sl.fill_between_percentile_lines && percentiles.length > 1) {
	  noStroke();
	  fill(sl.percentile_fill_color);
	  var height = percentiles[percentiles.length-1] - percentiles[0];
	  var width = scaled[l-1].x - scaled[0].x;
	  rect(scaled[0].x, percentiles[0], width, height);
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

	// Draw percentile lines.
	stroke(sl.percentile_line_color);
	for (var j=0;j<percentiles.length;j++) {
	  var y = percentiles[j];
	  line(scaled[0].x,y,scaled[l-1].x,y);
	}

	// Draw lines between data points.
	stroke(sl.line_color);
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
  if (data.length == 1) {
    data = [data[0],data[0]]
  }
  this.init(id,data,mixins);
}
Sparkline.prototype = new BaseSparkline();

var BarSparkline = function(id,data,mixins) {
  if (!mixins) mixins = {};

  this.marking_padding = 5;
  this.padding_between_bars = 5;
  this.extend_markings = true;
  if (!mixins.hasOwnProperty('scale_from')) mixins.scale_from = 0;

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
	background(sl.background_color);
	var scaled = sl.scale_data();
	var l = scaled.length;
	var sw = sl.segment_width();
	var gap = sl.padding_between_bars;
	var mp = sl.marking_padding;


	// Draw fill between value lines (if applicable).
	var value_lines = sl.calc_value_lines();
	if (sl.fill_between_value_lines && value_lines.length > 1) {
	  noStroke();
	  fill(sl.percentile_fill_color);
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

	// Draw fill between percentile lines (if applicable).
	var percentiles = sl.calc_percentiles();
	if (sl.fill_between_percentile_lines && percentiles.length > 1) {
	  noStroke();
	  fill(sl.percentile_fill_color);
	  var height = percentiles[percentiles.length-1] - percentiles[0];
	  var width = scaled[l-1].x - scaled[0].x + sw;
	  if (sl.extend_markings) {
	    width += 2 * mp;
	    rect(scaled[0].x - mp, percentiles[0], width, height);
	  }
	  else rect(scaled[0].x, percentiles[0], width, height);
	}
	// Draw percentile lines.
	stroke(sl.percentile_line_color);
	for (var j=0;j<percentiles.length;j++) {
	  var y = percentiles[j];
	  if (sl.extend_markings) {
	    line(scaled[0].x - mp,y,scaled[l-1].x+ mp + sw,y);
	  }
	  else line(scaled[0].x,y,scaled[l-1].x+sw,y);
	}

	// Draw bars.
	stroke(sl.line_color);
	fill(sl.line_color);
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
