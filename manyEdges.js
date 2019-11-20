//-------------------------------------------------------------------------------------
// VARIABLES
//-------------------------------------------------------------------------------------
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    var imageContainer = document.getElementById("imageContainer");
    var button= document.getElementById("unselectEdgeButton");



    var svg = d3.select("svg");

    var height = +svg.attr("height")
    var width= width = +svg.attr("width");
    var node;
    var edge;

    // Response by other nodes when you drag
    var simulation = d3.forceSimulation()
       .force("link", d3.forceLink().id(function (d) {return d.id;}))

    var drag= d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)

    // This ensures that the edges have the proper opacity and width at the start
    var edgeAttributes= {
        "class": "link",
        'stroke-width': 2,
        'stroke-opacity': .4,
    }

    var svgAttributes= {'id':'arrowhead',
            'viewBox':'-0 -5 10 10',
            'refX':13,
            'refY':0,
            'orient':'auto',
            'markerWidth':13,
            'markerHeight':13,
            'xoverflow':'visible'}


    // CONSTANTS
    //-------------------------------------------------------------------------------------

    var spaceBetweenEdges=10
    var isExpandedEdgeDistance=false


//-------------------------------------------------------------------------------------
// NON FUNCTIONS
//-------------------------------------------------------------------------------------

    svg.append('defs').append('marker')
            .style('stroke','none')

        // This is to ensure that errors dont occur when updating the graph
    d3.json("mainGraphData.json", function (error, graph) {
        if (error) throw error;
        handleUpdate(graph.links, graph.nodes);
    })



//-------------------------------------------------------------------------------------
// FUNCTIONS
//-------------------------------------------------------------------------------------

    // HANDLE FUNCTIONS
    //-------------------------------------------------------------------------------------


        // This calls all the necessary functions for updating the program
     function handleUpdate(edges, nodes) {
        console.log("version 11")
        handleEdges(edges)
        handleNodes(nodes)
        var images= createImages()
        var setEvents= setImageEvents(images)
        var setEvents= setEdgeEvents()
        handleSimulation(nodes, edges)
        button.setAttribute("style", "color:black; border: 1px solid black; font-size: 100%");
        button.addEventListener("click", function(){unselectAllEdges(edges) });

    }




    // I believe this is designed to ensure that things are animated
    function handleSimulation(nodes, edges){
        simulation
            .nodes(nodes)
            .on("tick", ticked);

        simulation.force("link")
           .links(edges);

    }

    // This creates lines between the artworks using the information from the JSON data and the edgeAttributes
    function handleEdges(edges){
        createMatchesWithList(edges) //remove for bounded
        setAllInitialEdgeDistances(edges, spaceBetweenEdges) // remove for bounded
        edge = svg.selectAll(".link")
                .data(edges)
                .enter()
                .append("line")
                .attrs(edgeAttributes)

        edge.attr('stroke', function (d) {return setEdgeColors(d)});
        edge.attr('id', function(d){return d.title})



    }


    // This ensured that the nodes are set up with the proper data and functionality
    function handleNodes(nodes){
        node = svg.selectAll(".node")
                .data(nodes)
                .enter()
                .append("g")
                .attr("class", "node")
                .on("click", nodeClick)
                .call(drag);

    }

    // GETTERS AND SETTERS
    //-------------------------------------------------------------------------------------



    // This sets the initial distances between the edges
    function setAllInitialEdgeDistances(edges, spaceBetweenEdges){
        for(edgeIndex in edges){
            currentEdge= edges[edgeIndex]
            setInitialEdgeDistance(currentEdge, spaceBetweenEdges)
        }

    }

    function unselectAllEdges(edges){
       for(i=0; i<edges.length; i++){
            edges[i].isSelected=false
       }
       edge = svg.selectAll(".link")
              .attr( 'stroke-width', 2)
              .attr( 'stroke-opacity', .4)

    }

    // This sets the distances of the edges when the edge space is to be expanded or contracted
    function setExpansionEdgeDistance(currentEdge, listChange, spaceBetweenEdges){
            if(listChange==spaceBetweenEdges){
                currentEdge.edgeChangeX=-spaceBetweenEdges
            }
            else if(listChange== -spaceBetweenEdges){
                currentEdge.edgeChangeX= spaceBetweenEdges
            }
            else if(listChange== spaceBetweenEdges*2){
                currentEdge.edgeChangeX=-spaceBetweenEdges*2
            }
            else if(listChange== -spaceBetweenEdges*2){
                currentEdge.edgeChangeX=spaceBetweenEdges*2
            }

     }


    // This allows the edges to grow and shrink on mouseovers
    function setEdgeEvents(){
        // make the edges grow on mouseover
        var setEvents = edge
              .on( 'mouseenter', function() {
                  setStrokeWidth(this, 5)
              })
              // set back
              .on( 'mouseleave', function(d) {
                if(!d.isSelected){
                    setStrokeWidth(this, 2)
                }
              })
              .on("click", edgeClick)
              .on("dblclick",doubleClickEdge);

    }


    // This set the width of the edges
    function setStrokeWidth(edge, width){
        d3.select( edge )
          .transition()
          .attr( 'stroke-width', width)


    }


    function setStrokeOpaqueness(edge, opaque){
        d3.select( edge )
          .transition()
          .attr( 'stroke-opacity', opaque)


    }

    // This creates all the images and attaches attributes on their x and y positions as well at their height and
    //width for further use
    function createImages(){
        var startingLocation=-25;
        var images = node.append("svg:image")
            .attr("xlink:href",  function(d) { return d.img;})
            .attr("height", function(d) { return d.height;})
            .attr("width", function(d) { return d.width;});
        return images
    }

    //This gets the new measurements of the width or the height based on a 1.5x growth
    function getGrowthImageSize(widthOrHeight){
           return widthOrHeight*1.5;
    }


    // This function allows the images to grow and shrink on mouseovers
    function setImageEvents(images){
    // make the image grow a little on mouse over
        var setEvents = images
              .on( 'mouseenter', function(d) {
                setImageSize(this, getGrowthImageSize(d.height), getGrowthImageSize(d.width) )
              })
              // set back
              .on( 'mouseleave', function(d) {
                if(!d.isSelected){
                    setImageSize(this, d.height, d.width)
                }
              });
         return setEvents;


    }



    // this sets the image size
    function setImageSize(image, height, width){
        d3.select( image )
          .transition()
          .attr("X", function(d) { return d.x;})
          .attr("Y", function(d) { return d.y;})
          .attr("height", function(d) { return height;})
          .attr("width", function(d) { return width;});


    }


    //This looks at all edges and records all the matching edges information into each edge
    function createMatchesWithList(edges){
        var i=0;
        while (i< edges.length){
            var j=0;
            while(j<edges.length){
                if(isAMatchingEdges(edges[i], edges[j], i, j)){
                    appendMatchingEdge(edges[i], edges[j])

                }
            j++;
            }
        i++;
        }

    }

    // this ensures that the images can't be dragged out of a specific range
     function setDragBoundaries(x, y, width, height){
      var min= 50;
      var maxWidth= getGrowthImageSize(width);
      var maxHeight= getGrowthImageSize(height)
        if(x<min){
            x=min
        }
        if(y<min){
            y=min
        }
        if( x> svg.attr("width")-maxWidth){
            x=svg.attr("width")-maxWidth
        }
        if( y> svg.attr("height")-maxHeight){
            y=svg.attr("height")-maxHeight
        }

        return [x,y]

     }


     // set colors to mean different edge types
    function setEdgeColors(edge){
        edgeType= edge.type;
        if(edgeType== "context"){
            return '#FFA500'; // orange
        }
        else if(edgeType== "subject"){
            return '#3386FF'; //blue
        }
        else if(edgeType== "material"){
            return '#008000'; //green
        }
        else if(edgeType== "symbol"){
            return '#FF0000'; // red
        }
        else{
            return '#000000';
        }

    }


    // This sets the initial location of an edge based on the space needed between edges and the the identity of the edge
    function setInitialEdgeDistance(edge, spaceBetweenEdges){
        if(edge.siblingIndentifier==0){
            setCoordinateDistance(edge, 0)
        }
        else if(edge.siblingIndentifier== 1){
            setCoordinateDistance(edge, spaceBetweenEdges)
        }
        else if(edge.siblingIndentifier==2){
            setCoordinateDistance(edge, -spaceBetweenEdges)

        }
        else if(edge.siblingIndentifier==3){
            setCoordinateDistance(edge, spaceBetweenEdges*2)

        }


    }


    // this sets the coordinate variable distance for each edge to the distance determined to be between each edge
    function setCoordinateDistance(edge, distance){
        edge.edgeChangeX=distance
        edge.edgeChangeY=distance
    }

    // this sets the edge location with the start and end coordinates
    function setEdgeLocations(edge){

        edge
                .attr("x1", function (d) {return getEdgeCoordinate(d.source.x, d.source.width)- d.edgeChangeX;})
                .attr("y1", function (d) {return getEdgeCoordinate(d.source.y, d.source.height)-d.edgeChangeY;})
                .attr("x2", function (d) {return getEdgeCoordinate(d.target.x, d.target.width)-d.edgeChangeX;})
                .attr("y2", function (d) {return getEdgeCoordinate(d.target.y, d.target.height)-d.edgeChangeY;})


    }


    // this calculates the location that the Edge is at
    function getEdgeCoordinate(coordinate, widthOrHeight){
        return coordinate+(widthOrHeight/2)

    }



    // BOOLEAN FUNCTIONS
    //-------------------------------------------------------------------------------------

    //This sees if an edge is within a list
    function isEdgeInList(list, edge){
        for (index in list){
            item= list[index]
            if(item.title==edge.title){
            return true}
        }
        return false
    }

    // this decides if an edge is a member of multiple edges from the same pair
    function isAMatchingEdges(edgeA, edgeB, indexA, indexB){
        return indexA!= indexB && edgeA.source == edgeB.source && edgeA.target == edgeB.target;
    }





    // EVENTS FUNCTIONS
    //-------------------------------------------------------------------------------------

    // This adds functionality to edges so that when they are double clicked the space between edges expands
    function doubleClickEdge(edge){
        isExpandedEdgeDistance= !isExpandedEdgeDistance
        if(edge.matchesWith){
            listOfEdges= edge.matchesWith

            if (!isEdgeInList(listOfEdges, edge)){
                listOfEdges.push(edge)
            }
            for(index in listOfEdges){
                currentEdge= listOfEdges[index]
                xChange= currentEdge.edgeChangeX
                setExpansionEdgeDistance(currentEdge, xChange, spaceBetweenEdges)
            }
        }
     }

     //This is called when a drag has begun and ensures that dragging protocols take place
    function dragstarted(d) {
       if (!d3.event.active) simulation.alphaTarget(0.3).restart()
         d.fx = d.x;
         d.fy = d.y;
     }


     // this concludes dragging and ensures that the proper information is stored
    // in the case things are dragged out of range they are brought back
    function dragged(d) {
       let coordinateTuple= setDragBoundaries(d3.event.x,d3.event.y, d.width, d.height)
       d.fx = coordinateTuple[0]
       d.fy = coordinateTuple[1]
    }

    // Display the information of the node when clicked
    function nodeClick(d){
      d3.select("h1").html(d.name);
      d3.select("h3").html(d.label);
      d.isSelected= !d.isSelected;
    }


    // display the information of the connection when clicked
    function edgeClick(edge){
      d3.select("h1").html(edge.title );
      d3.select("h3").html(edge.description);
      edge.isSelected= !edge.isSelected

      if(edge.isSelected){
        setStrokeOpaqueness(this, .8)
      }
      else{
        setStrokeOpaqueness(this, .4)
      }
     }

    // this translates information about the movement of the nodes and edges to ensure they are translated into
    // visual and stored information
    function ticked() {
        node
           .attr("transform", function (d) {
            return "translate(" + d.x + ", " + d.y + ")";});
        setEdgeLocations(edge)
    }



    // MISCELANEOUS
    //-------------------------------------------------------------------------------------

    //This makes a record of all the edges that have the same pair of images attached to it and adds it
    // to the ledge's documentation
    function appendMatchingEdge(sourceEdge, appendEdge){
        if(sourceEdge.matchesWith){
           sourceEdge.matchesWith.push(appendEdge);
        }
        else{
          sourceEdge.matchesWith= [appendEdge]
        }

    }