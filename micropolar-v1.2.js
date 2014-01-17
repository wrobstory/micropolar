var micropolar = {
    version: "0.2"
};

var µ = micropolar;

µ.Axis = function module() {
    var config = µ.Axis.defaultConfig();
    var svg, dispatch = d3.dispatch("hover"), radialScale, angularScale, colorScale;
    function exports() {
        var data = config.data;
        var axisConfig = config.axisConfig;
        var geometryConfig = config.geometryConfig;
        var legendConfig = config.legendConfig;
        var container = axisConfig.container;
        if (typeof container == "string" || container.nodeName) container = d3.select(container);
        container.datum(data).each(function(_data, _index) {
            var data = _data.map(function(d, i) {
                var validated = {};
                validated.name = d.name;
                if (!Array.isArray(d.x[0])) validated.x = [ d.x ];
                if (!Array.isArray(d.y[0])) validated.y = [ d.y ];
                return validated;
            });
            var radius = Math.min(axisConfig.width - axisConfig.margin.left - axisConfig.margin.right, axisConfig.height - axisConfig.margin.top - axisConfig.margin.bottom) / 2;
            var extent = d3.extent(d3.merge(d3.merge(data.map(function(d, i) {
                return d.y;
            }))));
            radialScale = d3.scale.linear().domain(axisConfig.radialDomain || extent).range([ 0, radius ]);
            var needsEndSpacing = axisConfig.needsEndSpacing;
            var angularDataMerged = d3.merge(d3.merge(data.map(function(d, i) {
                return d.x;
            })));
            var angularExtent = d3.extent(angularDataMerged);
            var angularDomain = axisConfig.angularDomain || angularExtent;
            if (needsEndSpacing) angularDomain[1] += angularDataMerged[1] - angularDataMerged[0];
            var step = (angularDomain[1] - angularDomain[0]) / (data[0].x[0][1] - data[0].x[0][0]);
            var angularTicksStep = axisConfig.angularTicksStep || (angularDomain[1] - angularDomain[0]) / (step * (axisConfig.minorTicks + 1));
            if (!angularDomain[2]) angularDomain[2] = angularTicksStep;
            var angularAxisRange = d3.range.apply(this, angularDomain);
            angularAxisRange = angularAxisRange.map(function(d, i) {
                return parseFloat(d.toPrecision(12));
            });
            angularScale = d3.scale.linear().domain(angularDomain.slice(0, 2)).range(axisConfig.flip ? [ 0, 360 ] : [ 360, 0 ]);
            console.log(step, angularDomain, angularDomain[1] - angularDomain[0], data[0].x[0][1], data[0].x[0][0]);
            svg = d3.select(this).select("svg.chart-root");
            if (typeof svg === "undefined" || svg.empty()) {
                var skeleton = '<svg xmlns="http://www.w3.org/2000/svg" class="chart-root">                         <g class="chart-group">                             <circle class="background-circle"></circle>                             <g class="angular axis-group"></g>                            <g class="geometry-group"></g>                            <g class="radial axis-group">                                 <circle class="outside-circle"></circle>                             </g>                             <g class="guides-group"><line></line><circle r="0"></circle></g>                         </g>                         <g class="legend-group"></g>                         <g class="title-group"><text></text></g>                     </svg>';
                var doc = new DOMParser().parseFromString(skeleton, "application/xml");
                var newSvg = this.appendChild(this.ownerDocument.importNode(doc.documentElement, true));
                svg = d3.select(newSvg);
            }
            var lineStyle = {
                fill: "none",
                stroke: "silver"
            };
            var fontStyle = {
                "font-size": axisConfig.fontSize,
                "font-family": axisConfig.fontFamily,
                fill: axisConfig.fontColor
            };
            svg.attr({
                width: axisConfig.width,
                height: axisConfig.height
            });
            var chartGroup = svg.select(".chart-group").attr("transform", "translate(" + [ axisConfig.margin.left + radius, axisConfig.margin.top + radius ] + ")");
            var radialAxis = svg.select(".radial.axis-group");
            if (axisConfig.showRadialCircle) {
                var gridCircles = radialAxis.selectAll("circle.grid-circle").data(radialScale.ticks(5));
                gridCircles.enter().append("circle").attr({
                    "class": "grid-circle"
                }).style(lineStyle);
                gridCircles.attr("r", radialScale);
                gridCircles.exit().remove();
            }
            radialAxis.select("circle.outside-circle").attr({
                r: radius
            }).style(lineStyle);
            svg.select("circle.background-circle").attr({
                r: radius
            }).style({
                fill: axisConfig.backgroundColor,
                stroke: axisConfig.stroke
            });
            var currentAngle = function(d, i) {
                return (angularScale(d) + axisConfig.originTheta) % 360;
            };
            if (axisConfig.showRadialAxis) {
                var axis = d3.svg.axis().scale(radialScale).ticks(5).tickSize(5);
                var radialAxis = svg.select(".radial.axis-group").call(axis).attr({
                    transform: "rotate(" + axisConfig.radialAxisTheta + ")"
                });
                radialAxis.selectAll(".domain").style(lineStyle);
                radialAxis.selectAll("g>text").text(function(d, i) {
                    return this.textContent + axisConfig.radialTicksSuffix;
                }).style(fontStyle).style({
                    "text-anchor": "start"
                }).attr({
                    x: 0,
                    y: 0,
                    dx: 0,
                    dy: 0,
                    transform: function(d, i) {
                        if (axisConfig.radialTickOrientation === "horizontal") return "rotate(" + -axisConfig.radialAxisTheta + ") translate(" + [ 0, fontStyle["font-size"] ] + ")"; else return "translate(" + [ 0, fontStyle["font-size"] ] + ")";
                    }
                });
                radialAxis.selectAll("g>line").style({
                    stroke: "black"
                });
            }
            var angularAxis = svg.select(".angular.axis-group").selectAll("g.angular-tick").data(angularAxisRange);
            var angularAxisEnter = angularAxis.enter().append("g").attr({
                "class": "angular-tick"
            });
            angularAxis.attr({
                transform: function(d, i) {
                    return "rotate(" + currentAngle(d, i) + ")";
                }
            });
            angularAxis.exit().remove();
            angularAxisEnter.append("line").attr({
                "class": "grid-line"
            }).classed("major", function(d, i) {
                return i % (axisConfig.minorTicks + 1) == 0;
            }).classed("minor", function(d, i) {
                return !(i % (axisConfig.minorTicks + 1) == 0);
            }).style(lineStyle);
            angularAxisEnter.selectAll(".minor").style({
                stroke: "#eee"
            });
            angularAxis.select("line.grid-line").attr({
                x1: axisConfig.tickLength ? radius - axisConfig.tickLength : 0,
                x2: radius
            });
            angularAxisEnter.append("text").attr({
                "class": "axis-text"
            }).style(fontStyle);
            var ticks = angularAxis.select("text.axis-text").attr({
                x: radius + axisConfig.labelOffset,
                dy: ".35em",
                transform: function(d, i) {
                    var angle = currentAngle(d, i);
                    var rad = radius + axisConfig.labelOffset;
                    var orient = axisConfig.angularTickOrientation;
                    if (orient == "horizontal") return "rotate(" + -angle + " " + rad + " 0)"; else if (orient == "radial") return angle < 270 && angle > 90 ? "rotate(180 " + rad + " 0)" : null; else return "rotate(" + (angle <= 180 && angle > 0 ? -90 : 90) + " " + rad + " 0)";
                }
            }).style({
                "text-anchor": "middle"
            }).text(function(d, i) {
                if (i % (axisConfig.minorTicks + 1) != 0) return "";
                if (axisConfig.ticks) return axisConfig.ticks[i / (axisConfig.minorTicks + 1)] + axisConfig.angularTicksSuffix; else return d + axisConfig.angularTicksSuffix;
            }).style(fontStyle);
            if (axisConfig.rewriteTicks) ticks.text(function(d, i) {
                return axisConfig.rewriteTicks(this.textContent, i);
            });
            var hasGeometry = svg.select("g.geometry-group").selectAll("g").size() > 0;
            if (geometryConfig[0] || hasGeometry) {
                var colorIndex = 0;
                geometryConfig.forEach(function(d, i) {
                    var groupClass = "geometry" + i;
                    var geometryContainer = svg.select("g.geometry-group").selectAll("g." + groupClass).data([ 0 ]);
                    geometryContainer.enter().append("g").classed(groupClass, true);
                    if (!d.color) {
                        d.color = axisConfig.defaultColorRange[colorIndex];
                        colorIndex = (colorIndex + 1) % axisConfig.defaultColorRange.length;
                        console.log(1, d.color);
                    }
                    var geometry = µ[geometryConfig[i].geometry]();
                    var individualGeometryConfig = µ.util.deepExtend({}, d);
                    console.log(2, individualGeometryConfig.color, individualGeometryConfig.geometry);
                    individualGeometryConfig.radialScale = radialScale;
                    individualGeometryConfig.angularScale = angularScale;
                    individualGeometryConfig.container = geometryContainer;
                    if (!individualGeometryConfig.originTheta) individualGeometryConfig.originTheta = axisConfig.originTheta;
                    individualGeometryConfig.index = i;
                    var individualGeometryConfigMixin = µ.util.deepExtend(µ[d.geometry].defaultConfig().geometryConfig, individualGeometryConfig);
                    console.log(individualGeometryConfigMixin.color, individualGeometryConfig.geometry);
                    geometry.config({
                        data: data[i],
                        geometryConfig: individualGeometryConfigMixin
                    })();
                });
            }
            if (legendConfig.showLegend) {
                var rightmostTickEndX = d3.max(chartGroup.selectAll(".angular-tick text")[0].map(function(d, i) {
                    return d.getCTM().e + d.getBBox().width;
                }));
                var legendContainer = svg.select(".legend-group").attr({
                    transform: "translate(" + [ radius + rightmostTickEndX, axisConfig.margin.top ] + ")"
                }).style({
                    display: "block"
                });
                var elements = geometryConfig.map(function(d, i) {
                    d.symbol = "line";
                    d.visibleInLegend = typeof d.visibleInLegend === "undefined" || d.visibleInLegend;
                    return d;
                });
                var legendConfigMixin1 = µ.util.deepExtend(µ.Legend.defaultConfig(), legendConfig);
                var legendConfigMixin2 = µ.util.deepExtend(legendConfigMixin1, {
                    container: legendContainer,
                    elements: elements
                });
                µ.Legend().config({
                    data: data.map(function(d, i) {
                        return d.name || "Element" + i;
                    }),
                    legendConfig: legendConfigMixin2
                })();
            } else {
                svg.select(".legend-group").style({
                    display: "none"
                });
            }
            if (axisConfig.title) {
                var title = svg.select("g.title-group text").attr({
                    x: 100,
                    y: 100
                }).style({
                    "font-size": 18,
                    "font-family": axisConfig.fontFamily,
                    fill: axisConfig.fontColor
                }).text(axisConfig.title);
                var titleBBox = title.node().getBBox();
                title.attr({
                    x: axisConfig.margin.left + radius - titleBBox.width / 2,
                    y: titleBBox.height
                });
            }
            function getMousePos() {
                var mousePos = d3.mouse(svg.node());
                var mouseX = mousePos[0] - axisConfig.width / 2;
                var mouseY = mousePos[1] - axisConfig.height / 2;
                var mouseAngle = (Math.atan2(mouseY, mouseX) + Math.PI) / Math.PI * 180;
                var r = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
                return {
                    angle: mouseAngle,
                    radius: r
                };
            }
            svg.select(".geometry-group g").style({
                "pointer-events": "visible"
            });
            var guides = svg.select(".guides-group");
            chartGroup.on("mousemove.angular-guide", function(d, i) {
                var mouseAngle = getMousePos().angle;
                guides.select("line").attr({
                    x1: 0,
                    y1: 0,
                    x2: -radius,
                    y2: 0,
                    transform: "rotate(" + mouseAngle + ")"
                });
            }).on("mouseout.angular-guide", function(d, i) {
                guides.select("line").style({
                    opacity: 0
                });
            });
            chartGroup.on("mousemove.radial-guide", function(d, i) {
                var r = getMousePos().radius;
                guides.select("circle").attr({
                    r: r
                }).style({
                    stroke: "grey",
                    fill: "none",
                    opacity: 0
                });
            }).on("mouseout.radial-guide", function(d, i) {
                guides.select("circle").style({
                    opacity: 0
                });
            });
            svg.selectAll(".geometry-group .mark").on("mouseenter.tooltip", function(d, i) {});
        });
        return exports;
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util.deepExtend(config, _x);
        return this;
    };
    exports.radialScale = function(_x) {
        return radialScale;
    };
    exports.angularScale = function(_x) {
        return angularScale;
    };
    exports.svg = function() {
        return svg;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.Axis.defaultConfig = function(d, i) {
    var config = {
        data: [ {
            x: [ 1, 2, 3, 4 ],
            y: [ 10, 11, 12, 13 ],
            name: "Line1"
        }, {
            x: [ 21, 22, 23, 24 ],
            y: [ 30, 31, 32, 33 ],
            name: "Line2"
        } ],
        geometryConfig: [],
        legendConfig: {
            showLegend: true
        },
        axisConfig: {
            defaultColorRange: d3.scale.category10().range(),
            radialDomain: null,
            angularDomain: null,
            angularTicksStep: null,
            angularTicksCount: 4,
            title: null,
            height: 450,
            width: 500,
            margin: {
                top: 50,
                right: 150,
                bottom: 50,
                left: 50
            },
            fontSize: 11,
            fontColor: "black",
            fontFamily: "Tahoma, sans-serif",
            flip: true,
            originTheta: 0,
            labelOffset: 10,
            radialAxisTheta: -45,
            ticks: null,
            radialTicksSuffix: "",
            angularTicksSuffix: "",
            angularTicks: null,
            showRadialAxis: true,
            showRadialCircle: true,
            minorTicks: 1,
            tickLength: null,
            rewriteTicks: null,
            angularTickOrientation: "horizontal",
            radialTickOrientation: "horizontal",
            container: "body",
            backgroundColor: "none",
            needsEndSpacing: true
        }
    };
    return config;
};

µ.util = {};

µ.util._override = function(_objA, _objB) {
    for (var x in _objA) if (x in _objB) _objB[x] = _objA[x];
};

µ.util._extend = function(_objA, _objB) {
    for (var x in _objA) _objB[x] = _objA[x];
};

µ.util._rndSnd = function() {
    return Math.random() * 2 - 1 + (Math.random() * 2 - 1) + (Math.random() * 2 - 1);
};

µ.util.dataFromEquation2 = function(_equation, _step) {
    var step = _step || 6;
    var data = d3.range(0, 360 + step, step).map(function(deg, index) {
        var theta = deg * Math.PI / 180;
        var radius = _equation(theta);
        return [ deg, radius ];
    });
    return data;
};

µ.util.dataFromEquation = function(_equation, _step, _name) {
    var step = _step || 6;
    var x = [], y = [], name = [];
    d3.range(0, 360 + step, step).forEach(function(deg, index) {
        var theta = deg * Math.PI / 180;
        var radius = _equation(theta);
        x.push(deg);
        y.push(radius);
    });
    var result = {
        x: x,
        y: y
    };
    if (_name) result.name = _name;
    return result;
};

µ.util.ensureArray = function(_val, _count) {
    if (typeof _val === "undefined") return null;
    var arr = [].concat(_val);
    return d3.range(_count).map(function(d, i) {
        return arr[i] || arr[0];
    });
};

µ.util.fillArrays = function(_obj, _valueNames, _count) {
    _valueNames.forEach(function(d, i) {
        _obj[d] = µ.util.ensureArray(_obj[d], _count);
    });
    return _obj;
};

µ.util.deepExtend = function(destination, source) {
    for (var property in source) {
        if (source[property] && source[property].constructor && source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            arguments.callee(destination[property], source[property]);
        } else {
            destination[property] = source[property];
        }
    }
    return destination;
};

µ.util.validateKeys = function(obj, keys) {
    if (typeof keys === "string") keys = keys.split(".");
    var next = keys.shift();
    return obj[next] && (!keys.length || objHasKeys(obj[next], keys));
};

µ.BarChart = function module() {
    var config = µ.BarChart.defaultConfig();
    var dispatch = d3.dispatch("hover");
    function exports() {
        var geometryConfig = config.geometryConfig;
        var container = geometryConfig.container;
        if (typeof container == "string") container = d3.select(container);
        container.datum(config.data).each(function(_data, _index) {
            var data = d3.zip(_data.x[0], _data.y[0]);
            var domain = geometryConfig.angularScale.domain();
            var angularScale = geometryConfig.angularScale;
            var markStyle = {
                fill: geometryConfig.color,
                stroke: d3.rgb(geometryConfig.color).darker().toString()
            };
            var barW = 12;
            var barY = geometryConfig.radialScale(geometryConfig.radialScale.domain()[0]);
            var geometryGroup = d3.select(this).classed("bar-chart", true);
            var geometry = geometryGroup.selectAll("rect.mark").data(data);
            geometry.enter().append("rect").attr({
                "class": "mark"
            });
            geometry.attr({
                x: -barW / 2,
                y: barY,
                width: barW,
                height: function(d, i) {
                    return geometryConfig.radialScale(d[1]) - barY;
                },
                transform: function(d, i) {
                    return "rotate(" + (geometryConfig.originTheta - 90 + angularScale(d[0])) + ")";
                }
            }).style(markStyle);
        });
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util.deepExtend(config, _x);
        return this;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.BarChart.defaultConfig = function() {
    var config = {
        data: {
            name: "Data",
            x: [ 0, 1, 2, 3 ],
            y: [ 10, 20, 30, 40 ]
        },
        geometryConfig: {
            geometry: "BarChart",
            container: "body",
            radialScale: null,
            angularScale: null,
            axisConfig: null,
            color: "#ffa500",
            dash: "solid",
            lineStrokeSize: 2,
            flip: true,
            originTheta: 0,
            opacity: 1,
            index: 0,
            visible: true,
            visibleInLegend: true
        }
    };
    return config;
};

µ.Clock = function module() {
    var config = {
        data: null,
        containerSelector: "body",
        fill: "orange",
        stroke: "red",
        radialScale: null,
        angularScale: null,
        axisConfig: null
    };
    var dispatch = d3.dispatch("hover");
    function exports() {
        var container = config.containerSelector;
        if (typeof container == "string") container = d3.select(container);
        container.datum(config.data).each(function(_data, _index) {
            var radius = config.radialScale.range()[1];
            var handsHeight = [ radius / 1.3, radius / 1.5, radius / 1.5 ];
            var handsWidth = [ radius / 15, radius / 10, radius / 30 ];
            _data = [ 0, 4, 8 ];
            config.angularScale.domain([ 0, 12 ]);
            var markStyle = {
                fill: config.fill,
                stroke: config.stroke
            };
            var geometryGroup = d3.select(this).classed("clock", true);
            var geometry = geometryGroup.selectAll("rect.mark").data(_data);
            geometry.enter().append("rect").attr({
                "class": "mark"
            });
            geometry.attr({
                x: function(d, i) {
                    return -handsWidth[i] / 2;
                },
                y: function(d, i) {
                    return i == 2 ? -radius / 5 : 0;
                },
                width: function(d, i) {
                    return handsWidth[i];
                },
                height: function(d, i) {
                    return handsHeight[i];
                },
                transform: function(d, i) {
                    return "rotate(" + (config.axisConfig.originTheta - 90 + config.angularScale(d)) + ")";
                }
            }).style(markStyle);
            geometryGroup.selectAll("circle.mark").data([ 0 ]).enter().append("circle").attr({
                "class": "mark"
            }).attr({
                r: radius / 10
            }).style({
                "fill-opacity": 1
            }).style(markStyle);
        });
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util._override(_x, config);
        return this;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.AreaChart = function module() {
    var config = {
        data: null,
        containerSelector: "body",
        dotRadius: 5,
        fill: "orange",
        stroke: "red",
        radialScale: null,
        angularScale: null,
        axisConfig: null
    };
    var dispatch = d3.dispatch("hover");
    function exports() {
        var container = config.containerSelector;
        if (typeof container == "string") container = d3.select(container);
        container.datum(config.data).each(function(_data, _index) {
            var domain = config.angularScale.domain();
            var angularScale = config.angularScale.copy().domain([ domain[0], domain[1] + _data[1][0] - _data[0][0] ]);
            var triangleAngle = 360 / _data.length * Math.PI / 180 / 2;
            var markStyle = {
                fill: config.fill,
                stroke: config.stroke
            };
            var geometryGroup = d3.select(this).classed("area-chart", true);
            var geometry = geometryGroup.selectAll("path.mark").data(_data);
            geometry.enter().append("path").attr({
                "class": "mark"
            });
            geometry.attr({
                d: function(d, i) {
                    var h = config.radialScale(d[1]);
                    var baseW = Math.tan(triangleAngle) * h;
                    return "M" + [ [ 0, 0 ], [ h, baseW ], [ h, -baseW ] ].join("L") + "Z";
                },
                transform: function(d, i) {
                    return "rotate(" + (config.axisConfig.originTheta - 90 + angularScale(d[0])) + ")";
                }
            }).style(markStyle);
        });
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util._override(_x, config);
        return this;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.StackedAreaChart = function module() {
    var config = µ.StackedAreaChart.defaultConfig();
    var dispatch = d3.dispatch("hover");
    function exports() {
        var geometryConfig = config.geometryConfig;
        var container = geometryConfig.container;
        if (typeof container == "string") container = d3.select(container);
        container.datum(config.data).each(function(_data, _index) {
            console.log("stacked", geometryConfig.color);
            var data = d3.zip(_data.x[0], _data.y[0]);
            var domain = geometryConfig.angularScale.domain();
            var angularScale = geometryConfig.angularScale;
            var dataStacked = d3.nest().key(function(d) {
                return d[2];
            }).entries(data);
            dataStacked.forEach(function(d) {
                d.values.forEach(function(val) {
                    val.x = val[0];
                    val.y = +val[1];
                });
            });
            var stacked = d3.layout.stack().values(function(d) {
                return d.values;
            });
            var geometryType = "arc";
            var generator = {};
            var baseY = geometryConfig.radialScale(geometryConfig.radialScale.domain()[0]);
            generator.bar = function(d, i) {
                var barH = geometryConfig.radialScale(d[1]) - baseY;
                var barW = 20;
                return "M" + [ [ barH, -barW / 2 ], [ barH, barW / 2 ], [ 0, barW / 2 ], [ 0, -barW / 2 ] ].join("L") + "Z";
            };
            generator.triangle = function(d, i) {
                var h = geometryConfig.radialScale(d.y + d.y0);
                var startH = baseY;
                var baseW = Math.tan(triangleAngle) * h;
                var startW = Math.tan(triangleAngle) * startH;
                return "M" + [ [ startH, startW ], [ h, baseW ], [ h, -baseW ], [ startH, -startW ] ].join("L") + "Z";
            };
            generator.arc = d3.svg.arc().startAngle(function(d) {
                return -triangleAngle + Math.PI / 2;
            }).endAngle(function(d) {
                return triangleAngle + Math.PI / 2;
            }).innerRadius(function(d) {
                return baseY;
            }).outerRadius(function(d) {
                return geometryConfig.radialScale(d.y);
            });
            var triangleAngle = angularScale(data[1][0] - data[0][0]) * Math.PI / 180 / 2;
            var markStyle = {
                fill: geometryConfig.color,
                stroke: "gray"
            };
            var geometryGroup = d3.select(this).classed("stacked-area-chart", true);
            var geometry = geometryGroup.selectAll("g.layer").data(stacked(dataStacked)).enter().append("g").classed("layer", true).selectAll("path.mark").data(function(d, i) {
                return d.values;
            });
            geometry.enter().append("path").attr({
                "class": "mark"
            });
            geometry.attr({
                d: generator[geometryType],
                transform: function(d, i) {
                    return "rotate(" + (geometryConfig.originTheta + angularScale(d[0])) + ")";
                }
            }).style(markStyle);
        });
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util.deepExtend(config, _x);
        return this;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.StackedAreaChart.defaultConfig = function() {
    var config = {
        data: [ 1, 2, 3, 4 ],
        geometryConfig: {
            geometry: "LinePlot",
            color: "#ffa500",
            dash: "solid",
            lineStrokeSize: 2,
            flip: true,
            originTheta: 0,
            container: "body",
            opacity: 1,
            radialScale: null,
            angularScale: null,
            index: 0,
            visible: true,
            visibleInLegend: true,
            colorScale: d3.scale.category20()
        }
    };
    return config;
};

µ.DotPlot = function module() {
    var config = µ.DotPlot.defaultConfig();
    var dispatch = d3.dispatch("hover");
    function exports() {
        var geometryConfig = config.geometryConfig;
        var container = geometryConfig.container;
        if (typeof container == "string") container = d3.select(container);
        container.datum(config.data).each(function(_data, _index) {
            console.log("dot", geometryConfig.color);
            var data = d3.zip(_data.x[0], _data.y[0]);
            var getPolarCoordinates = function(d, i) {
                var r = geometryConfig.radialScale(d[1]);
                var θ = geometryConfig.angularScale(d[0]) * Math.PI / 180 * (geometryConfig.flip ? 1 : -1);
                return {
                    r: r,
                    θ: θ
                };
            };
            var convertToCartesian = function(polarCoordinates) {
                var x = polarCoordinates.r * Math.cos(polarCoordinates.θ);
                var y = polarCoordinates.r * Math.sin(polarCoordinates.θ);
                return {
                    x: x,
                    y: y
                };
            };
            var markStyle = {
                fill: geometryConfig.color,
                stroke: d3.rgb(geometryConfig.color).darker().toString()
            };
            var geometryGroup = d3.select(this).classed("dot-plot", true);
            var geometry = geometryGroup.selectAll("circle.mark").data(data);
            geometry.enter().append("circle").attr({
                "class": "mark"
            });
            geometry.attr({
                cx: function(d, i) {
                    return convertToCartesian(getPolarCoordinates(d)).x;
                },
                cy: function(d, i) {
                    return convertToCartesian(getPolarCoordinates(d)).y;
                },
                r: geometryConfig.radius
            }).style(markStyle);
        });
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util.deepExtend(config, _x);
        return this;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.DotPlot.defaultConfig = function() {
    var config = {
        data: [ 1, 2, 3, 4 ],
        geometryConfig: {
            geometry: "DotPlot",
            container: "body",
            radius: 3,
            radialScale: null,
            angularScale: null,
            axisConfig: null,
            color: "#ffa500",
            dash: "solid",
            lineStrokeSize: 2,
            flip: true,
            originTheta: 0,
            opacity: 1,
            index: 0,
            visible: true,
            visibleInLegend: true
        }
    };
    return config;
};

µ.LinePlot = function module() {
    var config = µ.LinePlot.defaultConfig();
    var dispatch = d3.dispatch("hover");
    var dashArray = {
        solid: "none",
        dash: [ 5, 2 ],
        dot: [ 2, 5 ]
    };
    function exports() {
        var geometryConfig = config.geometryConfig;
        var container = geometryConfig.container;
        if (typeof container == "string") container = d3.select(container);
        container.datum(config.data).each(function(_data, _index) {
            var data = d3.zip(_data.x[0], _data.y[0]);
            var line = d3.svg.line.radial().radius(function(d) {
                return geometryConfig.radialScale(d[1]);
            }).angle(function(d) {
                return geometryConfig.angularScale(d[0]) * Math.PI / 180 * (geometryConfig.flip ? 1 : -1);
            });
            var markStyle = {
                fill: "none",
                "stroke-width": geometryConfig.lineStrokeSize,
                stroke: geometryConfig.color,
                "pointer-events": "stroke"
            };
            var geometryGroup = d3.select(this).classed("line-plot", true);
            var geometry = geometryGroup.selectAll("path.mark").data([ 0 ]);
            geometry.enter().append("path").attr({
                "class": "mark"
            });
            geometryGroup.select("path.mark").datum(data).attr({
                d: line,
                transform: "rotate(" + (geometryConfig.originTheta + 90) + ")",
                "stroke-width": geometryConfig.lineStrokeSize + "px",
                "stroke-dasharray": dashArray[geometryConfig.dash],
                opacity: geometryConfig.opacity,
                display: geometryConfig.visible ? "block" : "none"
            }).style(markStyle);
        });
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util.deepExtend(config, _x);
        return this;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.LinePlot.defaultConfig = function() {
    var config = {
        data: [ 1, 2, 3, 4 ],
        geometryConfig: {
            geometry: "LinePlot",
            color: "#ffa500",
            dash: "solid",
            lineStrokeSize: 2,
            flip: true,
            originTheta: 0,
            container: "body",
            opacity: 1,
            radialScale: null,
            angularScale: null,
            index: 0,
            visible: true,
            visibleInLegend: true
        }
    };
    return config;
};

µ.Legend = function module() {
    var config = µ.Legend.defaultConfig();
    var dispatch = d3.dispatch("hover");
    function exports() {
        var legendConfig = config.legendConfig;
        var data = config.data.filter(function(d, i) {
            return legendConfig.elements[i].visibleInLegend;
        });
        if (legendConfig.reverseOrder) data = data.reverse();
        var container = legendConfig.container;
        if (typeof container == "string" || container.nodeName) container = d3.select(container);
        var colors = legendConfig.elements.map(function(d, i) {
            return d.color;
        });
        var lineHeight = legendConfig.fontSize;
        var isContinuous = legendConfig.isContinuous == null ? typeof data[0] === "number" : legendConfig.isContinuous;
        var height = isContinuous ? legendConfig.height : lineHeight * data.length;
        var geometryGroup = container.classed("legend-group", true);
        var svg = geometryGroup.selectAll("svg").data([ 0 ]);
        svg.enter().append("svg").attr({
            width: 300,
            height: height + lineHeight,
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xmlns:xlink": "http://www.w3.org/1999/xlink",
            version: "1.1"
        }).append("g").classed("legend-axis", true);
        var svgGroup = svg.html("");
        var colorScale = d3.scale[isContinuous ? "linear" : "ordinal"]().domain(config.data).range(colors);
        var dataScale = d3.scale[isContinuous ? "linear" : "ordinal"]().domain(data)[isContinuous ? "range" : "rangePoints"]([ 0, height ]);
        var shapeGenerator = function(_type, _size) {
            var squareSize = _size * 3;
            if (_type === "line") {
                return "M" + [ [ -_size / 2, -_size / 12 ], [ _size / 2, -_size / 12 ], [ _size / 2, _size / 12 ], [ -_size / 2, _size / 12 ] ] + "Z";
            } else if (d3.svg.symbolTypes.indexOf(_type) != -1) return d3.svg.symbol().type(_type).size(squareSize)(); else return d3.svg.symbol().type("square").size(squareSize)();
        };
        if (isContinuous) {
            var gradient = svgGroup.append("defs").append("linearGradient").attr({
                id: "grad1",
                x1: "0%",
                y1: "0%",
                x2: "0%",
                y2: "100%"
            }).selectAll("stop").data(colors);
            gradient.enter().append("stop");
            gradient.attr({
                offset: function(d, i) {
                    return i / (colors.length - 1) * 100 + "%";
                }
            }).style({
                "stop-color": function(d, i) {
                    return d;
                }
            });
            svgGroup.append("rect").classed("legend-mark", true).attr({
                height: legendConfig.height,
                width: legendConfig.colorBandWidth,
                fill: "url(#grad1)"
            });
        } else {
            var legendElement = svgGroup.selectAll("path.legend-mark").data(data);
            legendElement.enter().append("path").classed("legend-mark", true);
            legendElement.attr({
                transform: function(d, i) {
                    return "translate(" + [ lineHeight / 2, dataScale(d) + lineHeight / 2 ] + ")";
                },
                d: function(d, i) {
                    var symbolType = legendConfig.elements[i].symbol;
                    return shapeGenerator(symbolType, lineHeight);
                },
                fill: function(d, i) {
                    return colorScale(d, i);
                }
            });
            legendElement.exit().remove();
        }
        var legendAxis = d3.svg.axis().scale(dataScale).orient("right");
        var axis = svgGroup.select("g.legend-axis").attr({
            transform: "translate(" + [ isContinuous ? legendConfig.colorBandWidth : lineHeight, lineHeight / 2 ] + ")"
        }).call(legendAxis);
        axis.selectAll(".domain").style({
            fill: "none",
            stroke: "none"
        });
        axis.selectAll("line").style({
            fill: "none",
            stroke: isContinuous ? legendConfig.textColor : "none"
        });
        axis.selectAll("text").style({
            fill: legendConfig.textColor,
            "font-size": legendConfig.fontSize
        });
        return exports;
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        µ.util.deepExtend(config, _x);
        return this;
    };
    d3.rebind(exports, dispatch, "on");
    return exports;
};

µ.Legend.defaultConfig = function(d, i) {
    var config = {
        data: [ "a", "b", "c" ],
        legendConfig: {
            elements: [ {
                symbol: "line",
                color: "red"
            }, {
                symbol: "square",
                color: "yellow"
            }, {
                symbol: "diamond",
                color: "limegreen"
            } ],
            height: 150,
            colorBandWidth: 30,
            fontSize: 12,
            container: "body",
            isContinuous: null,
            textColor: "grey",
            reverseOrder: false
        }
    };
    return config;
};

µ.adapter = {};

µ.adapter.plotly = function module() {
    var exports = {};
    exports.convert = function(_inputConfig) {
        var outputConfig = {};
        var r = {};
        if (_inputConfig.data) {
            outputConfig.data = _inputConfig.data.map(function(d, i) {
                return {
                    x: d.x,
                    y: d.y,
                    name: d.name
                };
            });
            outputConfig.geometryConfig = _inputConfig.data.map(function(d, i) {
                r = {};
                if (d.type) r.geometry = d.type.substr("Polar".length);
                if (d.line && d.line.color) r.color = d.line.color;
                if (d.line && d.line.width) r.lineStrokeSize = d.line.width;
                if (d.line && d.line.dash) r.dash = d.line.dash;
                if (d.opacity) r.opacity = d.opacity;
                if (typeof d.visible != "undefined") r.visible = d.visible;
                if (typeof d.visibleInLegend != "undefined") r.visibleInLegend = d.visibleInLegend;
                return r;
            });
        }
        if (_inputConfig.layout) {
            outputConfig.legendConfig = {};
            r = {};
            d3.entries(_inputConfig.layout).forEach(function(d, i) {
                if (d.key === "height") r.height = d.value;
                if (d.key === "width") r.width = d.value;
                if (d.key === "title") r.title = d.value;
                if (d.key === "showlegend") outputConfig.legendConfig.showLegend = d.value;
                if (d.key === "direction") r.flip = d.value === "clockwise";
                if (d.key === "legend") {
                    if (d.value.traceorder) outputConfig.legendConfig.reverseOrder = d.value.traceorder === "reversed";
                }
                if (d.key === "plot_bgcolor") r.backgroundColor = d.value;
                if (d.key === "xaxis") {
                    if (typeof d.value.range != "undefined") r.angularDomain = d.value.range;
                    if (typeof d.value.tickCount != "undefined") r.angularTicksCount = d.value.tickCount;
                    if (typeof d.value.minorTickCount != "undefined") r.minorTicks = d.value.minorTickCount;
                    if (d.value.suffix) r.angularTicksSuffix = d.value.suffix;
                }
                if (d.key === "yaxis") {
                    if (typeof d.value.range != "undefined") r.radialDomain = d.value.range;
                    if (d.value.suffix) r.radialTicksSuffix = d.value.suffix;
                    if (typeof d.value.orientation != "undefined") r.radialAxisTheta = d.value.orientation;
                }
                if (d.key === "font") {
                    if (d.value.size) r.fontSize = d.value.size;
                    if (d.value.color) r.fontColor = d.value.color;
                    if (d.value.family) r.fontFamily = d.value.family;
                }
                if (d.key === "margin") {
                    var source = [ "t", "r", "b", "l", "pad" ];
                    var target = [ "top", "right", "bottom", "left", "pad" ];
                    r.margin = {};
                    d3.entries(d.value).forEach(function(dB, iB) {
                        r.margin[target[source.indexOf(dB.key)]] = dB.value;
                    });
                }
                if (d.key === "orientation") r.originTheta = d.value;
            });
            outputConfig.axisConfig = r;
            if (_inputConfig.container) outputConfig.axisConfig.container = _inputConfig.container;
        }
        return outputConfig;
    };
    return exports;
};