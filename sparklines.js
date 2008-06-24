/* Sparklines.js */

var Sparkline = function(id,data,mixins) {
  this.background = 50;
  this.stroke = 230;
  this.canvas = document.getElementById(id);
  this.data = data;

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
  this.top_padding = 10;
  this.bottom_padding = 10;
  this.scale_height = function() {
    var l = this.data.length;
    if (l == 0) return [];
    var h = this.canvas.height - this.top_padding - this.bottom_padding;
    var max = this.parse_height(this.data[0]);
    for (var i=0; i<l;i++) {
      max = Math.max(max,this.parse_height(this.data[i]));
    }
    var scale = function(x) {
      var ratio = (x * 1.0) / max;
      return h - (h * ratio) + this.top_padding;
    };
    var heights = [];
    for (var i=0; i<l;i++) {
      var x = this.data[i];
      var ratio = (x * 1.0) / max;
      var raw = h - (h * ratio) + this.top_padding;
      heights.push(raw);
    }
    return heights;
  };
  this.left_padding = 10;
  this.right_padding = 10;
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
      setup = function() {
	stroke(sl.stroke);
	background(sl.background);
      };
      draw = function() {
	background(sl.background);
	scaled = sl.scale_data();
	var l = scaled.length;
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

  /* Apply any overriding variables that
   * are specified in the mixins parameter.
   */
  for (var property in mixins) {
    this[property] = mixins[property];
  };
};