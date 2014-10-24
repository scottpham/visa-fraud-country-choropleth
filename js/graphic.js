var mobileThreshold = 400, //set to 500 for testing
    aspect_width = 16,
    aspect_height = 9;

//standard margins
var margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};
//jquery shorthand
var $graphic = $('#graphic');
//base colors
var colors = {
    'red1': '#6C2315', 'red2': '#A23520', 'red3': '#D8472B', 'red4': '#E27560', 'red5': '#ECA395', 'red6': '#F5D1CA',
    'orange1': '#714616', 'orange2': '#AA6A21', 'orange3': '#E38D2C', 'orange4': '#EAAA61', 'orange5': '#F1C696', 'orange6': '#F8E2CA',
    'yellow1': '#77631B', 'yellow2': '#B39429', 'yellow3': '#EFC637', 'yellow4': '#F3D469', 'yellow5': '#F7E39B', 'yellow6': '#FBF1CD',
    'teal1': '#0B403F', 'teal2': '#11605E', 'teal3': '#17807E', 'teal4': '#51A09E', 'teal5': '#8BC0BF', 'teal6': '#C5DFDF',
    'blue1': '#28556F', 'blue2': '#3D7FA6', 'blue3': '#51AADE', 'blue4': '#7DBFE6', 'blue5': '#A8D5EF', 'blue6': '#D3EAF7'
};

/*
 * Render the graphic
 */
//check for svg
$(window).load(function() {
    draw_graphic();
});

function draw_graphic(){
    if (Modernizr.svg){
        $graphic.empty();
        var width = $graphic.width();
        render(width);
        window.onresize = draw_graphic; //very important! the key to responsiveness
    }
}

function render(w) {

    //empty object for storing mobile dependent variables
    var mobile = {};

    //calculate height against container width
    var height = Math.ceil((w * aspect_height) / aspect_width);

    //check for mobile
    function ifMobile (w) {
        if(w < mobileThreshold){
            mobile.scale = [w/2, height/2];
        }
        else{
            mobile.scale = [w/2, height/2];

        }
    } 
    //call mobile check
    ifMobile(w);

    width = w;

    //tie scale to width
    var scaleNum = 1.1 * w;

    //default us projection
    var projection = d3.geo.albersUsa()
        .scale(scaleNum)
        .translate(mobile.scale);

    //define path
    var path = d3.geo.path()
        .projection(projection);

    //create main svg container
    //would normally append a g but don't need because no chart
    var svg = d3.select("#graphic").append("svg")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height);

    queue()
        .defer(d3.json, "states.json")
        .defer(d3.csv, "h1b.csv")
        .defer(d3.csv, "topfive.csv")
        .await(ready);

    //define array for state/visa value pairs
    var visasByState = []; //total visas

    //for tooltip
    var commaFormat = d3.format(",f"); //formats to two decimal places

    function ready(error, us, visa, companies){
        //get an array of arrays states/lcas 
        visa.forEach(function(d){ 
            visasByState[d.state] = +d.lcas;
        });

        var statesTopo = topojson.feature(us, us.objects.states);

        //define max lca value
        lcaMax = d3.max(visa, function(d){ return +d.lcas });

        //define color scale
        var color = d3.scale.quantize()
            .domain([0, lcaMax])
            .range(colorbrewer.Oranges[5]);

        //initialize tip
        tip = d3.tip().attr("class", "d3-tip").html(function(d) { 
            var name = d.properties.name
            return "<p>" + name + "</p>LCAs in 2013: " + commaFormat(visasByState[name]); })

        svg.call(tip);
        //hide tip on resize

        //make sidebar right height
        //this only matters b/c of background color
        $("#sidebar").height(height + 5);

        //clean out whatever might be in there from a previous resize
        $("#sidebar").empty();

        //create infobox using old tooltip strategy
        var div = d3.select("#sidebar")
            .append("div")
            .attr("class", "tooltip")
            .html("Hover over a state for more info")
            .style("opacity", 1);

        //function that writes html to list
        function listRollOver(d){
            //empty array for top five employers
            list = [];

            //filter based on state
            $.each(companies, function(i, v){
                if (v.state == d.properties.name){
                    list.push(v.company);
                    }
            });

            //list of employers
            div.html("<p><span style='font-size:18px'>" + d.properties.name + "</span></p><p>Top Five Employers By LCAs: </p><ul><li>" + list[0] + "</li><li>" + list[1] + "</li><li>" + list[2] + "</li><li>" + list[3] + "</li><li>" + list[4] + "</li></ul>");
            
            return div;
        }


        //append group of states to svg
        svg.append("g")
              .attr("class", "states")
            .selectAll("path")
              .data(statesTopo.features)
            .enter().append("path")
              .attr("class", function(d) { return "state " + d.properties.name; })
              .attr("d", path)
            .on("mouseover", function(d){
                tip.show(d);
                listRollOver(d);
            })
            .on("mouseout", function(d){
                tip.hide();
            });
        //colors
        svg.selectAll(".state")
            .data(statesTopo.features)
            .style("fill", function(d){
                var name = d.properties.name
                return color(visasByState[name]);
            }); 


        //write path for outline
        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function (a, b) {return a === b; }))
            .attr("class", "state boundary")
            .attr("d", path);

        //write path for interiors
        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function(a,b) { return a !==b; }))
            .attr("class", "interior")
            .attr("d", path);

    }//end function ready



    //coercion function called back during csv call
    function type(d){
        d.value = +d.value;
        return d;
    }

}//end function render    





