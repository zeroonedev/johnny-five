var Board = require("./board");
var Emitter = require("events").EventEmitter;
var util = require("util");
var priv = new Map();

var bytes = ["a", "b"];

var Controllers = {
  // This is a placeholder...
  DEFAULT: {
    initialize: {
      value: function(opts, dataHandler) {
        var pins = opts.pins || [];
        var readBytes = {
          a: 0,
          b: 0
        };
        var lastBytes = {
          a: 0,
          b: 0
        };
        var reading = 0;
        var value = 0;
        var lowest = 1;
        var highest = opts.positions;
        var step = 1;

        pins.forEach(function(pin, index) {
          this.io.pinMode(pin, this.io.MODES.INPUT);
          this.io.digitalWrite(pin, this.io.HIGH);

          this.io.digitalRead(pin, function(data) {
            var byte = bytes[index];

            readBytes[byte] = data;

            if (index === reading) {
              reading++;
            }

            if (reading === 2) {
              reading = 0;
              decode();
            }
          }.bind(this));
        }, this);

        function decode() {
          // A has gone from low to high.
          if (readBytes.a && !lastBytes.a) {
            if (!readBytes.b) {
              value = value + step;
            } else {
              value = value - step;
            }

            if (value > highest) {
              value = value - highest;
            }

            if (value < lowest) {
              value = value + highest;
            }

            dataHandler(value);
          }

          lastBytes.a = readBytes.a;
          lastBytes.b = readBytes.b;

          readBytes.a = 0;
          readBytes.b = 0;
        }
      }
    },
    toPosition: {
      value: function(raw) {
        return raw;
      }
    }
  },
};



/**
 * Encoder
 * @constructor
 *
 */

function Encoder(opts) {

  if (!(this instanceof Encoder)) {
    return new Encoder(opts);
  }

  var controller = null;
  var state = {};
  var freq = opts.freq || 25;
  var raw = 0;
  var last = null;

  // var trigger = __.debounce(5, function(type, data) {
  //   this.emit(type, data);
  // });

  Board.Component.call(
    this, opts = Board.Options(opts)
  );

  if (typeof opts.controller === "string") {
    controller = Controllers[opts.controller];
  } else {
    controller = opts.controller || Controllers.DEFAULT;
  }

  Board.Controller.call(this, controller, opts);

  if (!this.toRGB) {
    this.toRGB = opts.toRGB || function(x) {
      return x;
    };
  }

  priv.set(this, state);

  Object.defineProperties(this, {
    value: {
      get: function() {
        return raw;
      }
    },
    position: {
      get: function() {
        return this.toPosition(raw);
      }
    }
  });

  if (typeof this.initialize === "function") {
    this.initialize(opts, function(data) {
      raw = data;
    });
  }

  setInterval(function() {
    if (raw === undefined) {
      return;
    }

    var data = {
      position: this.position,
    };

    this.emit("data", data);

    if (raw !== last) {
      last = raw;
      // trigger.call(this, "change", data);
      this.emit("change", data);
    }
  }.bind(this), freq);
}

util.inherits(Encoder, Emitter);




module.exports = Encoder;
console.log(Object.keys(Controllers));
