var mobileThreshold = 300, //set to 500 for testing
    aspect_width = 16,
    aspect_height = 9;

//standard margins
var margin = {
    top: 30,
    right: 30,
    bottom: 20,
    left: 30
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
    //check for mobile
    function ifMobile (w) {
        if(w < mobileThreshold){
        }
        else{
        }
    } 
    //call mobile check
    ifMobile(w);

    width = w;

    //calculate height against container width
    var height = Math.ceil((width * aspect_height) / aspect_width); // - margin.top - margin.bottom;

    //tie scale to width
    var scaleNum = w;
    console.log(scaleNum);
    //default us projection
    var projection = d3.geo.albersUsa()
        .scale(scaleNum)
        .translate([w/2.5, height / 2]);

    //define path
    var path = d3.geo.path()
        .projection(projection);

    //create main svg container
    //would normally append a g but don't need because no chart
    var svg = d3.select("#graphic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    queue()
        .defer(d3.json, "states.json")
        .defer(d3.csv, "h1b.csv")
        .defer(d3.csv, "topfive.csv")
        .await(ready);

    //define array for state/visa value pairs
    var visasByState = []; //total visas
    var companyByState = []; //top five companies
    var lcasByState = [];

    //for tooltip
    var commaFormat = d3.format(",f"); //formats to two decimal places

    function ready(error, us, visa, companies){
        //get an array of arrays states/lcas 
        visa.forEach(function(d){ 
            visasByState[d.state] = +d.lcas;
        });

       //  companies.forEach(function(d){
       //      var object = {};
       //      object[d.state] = d.company;
       //      companyByState.push(object);
       //  });

       // companies.forEach(function(d){
       //      var object = {};
       //      object[d.company] = d.lcas;
       //      lcasByState.push(object);
       //  });

        console.log(companies)


        var statesTopo = topojson.feature(us, us.objects.states);

        //define max lca value
        lcaMax = d3.max(visa, function(d){ return +d.lcas });

        //define color scale
        var color = d3.scale.quantize()
            .domain([0, lcaMax ])
            .range(colorbrewer.Oranges[5]);

        //initialize tip
        tip = d3.tip().attr("class", "d3-tip").html(function(d) { 
            var name = d.properties.name
            return "<p>" + name + "</p>H-1B Visas: " + visasByState[name]; })

        svg.call(tip);

        //create infobox using old tooltip code
        var div = d3.select("#graphic").append("div")
            .attr("class", "tooltip")
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
            div.html("<p>" + d.properties.name + "</p><p>Top Five H-1B Employers: </p><ul><li>" + list[0] + "</li><li>" + list[1] + "</li><li>" + list[2] + "</li><li>" + list[3] + "</li><li>" + list[4] + "</li></ul>");
            
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
            .on("mouseout", tip.hide);

        //colors
        svg.selectAll(".state")
            .data(statesTopo.features)
            .style("fill", function(d){
                var name = d.properties.name
                return color(visasByState[name]);
            }); 

        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function (a, b) {return a === b; }))
            .attr("class", "state boundary")
            .attr("d", path);

    }//end function ready



    //coercion function called back during csv call
    function type(d){
        d.value = +d.value;
        return d;
    }

}//end function render    





