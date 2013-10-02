/*
    Copyright 2012 UW Information Technology, University of Washington

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    Changes
    =================================================================

    sbutler1@illinois.edu: attr(checked) to prop(checked).
*/

(function(m) {

    var deviceAgent = navigator.userAgent.toLowerCase();

    // detect ladscape orientation
    var landscape = (window.orientation) == 90 || (window.orientation == -90);

    // detect chrome ios
    var chrome = deviceAgent.match(/(crios)/);

    // detect ios versions
	var iphone = deviceAgent.match(/(iphone)/);
	var ipad = deviceAgent.match(/(ipad)/);
	var ios5 = navigator.userAgent.match(/OS [5](_\d)+ like Mac OS X/i);
	var ios56 = navigator.userAgent.match(/OS [56](_\d)+ like Mac OS X/i);

    // detect android versions
    var android = deviceAgent.match(/(android)/);
    var gingerbread = deviceAgent.match(/android 2\.3/i);
    var gingerbreadOrNewer = deviceAgent.match(/android [2-9]/i);
    var honeycombOrNewer = deviceAgent.match(/android [3-9]/i);
    var froyoOrOlder = android && !gingerbread && !honeycombOrNewer;

	$(document).ready(function() {

		setMobileContentHeights();

	   // check if a map_canvas exists... populate it
    	if ($("#map_canvas").length == 1) {
          initialize();
        }

		// initialize the carousel for mobile standalone space page
        initializeCarousel();
        resizeCarouselMapContainer();
        replaceUrls();

        // scroll to the top of page
        $('#top_link').click(function(e){
              // Prevent a page reload when a link is pressed
              e.preventDefault();
              // Call the scroll function
              scrollTo('top');
        });

        // scroll to top of filter list
        $('#filter_link').click(function(e){
              // Prevent a page reload when a link is pressed
              e.preventDefault();
              // Call the scroll function
              scrollTo('info_list');
        });

        // back to spaces button on mobile space details page
        $('#back_home_button').click(function() {
            location.href = '/';
        });

        // for iphones (ios5) - check if they have the ios detector cookie, if they don't give them one and show the popup
        // otherwise, don't do anything since they've already seen the popup --- updated ios6 supports smart banners
        if (iphone && ios5 || iphone && chrome ) {
            if (!$.cookie('showSpaceScoutiOS')){
                $.cookie('showSpaceScoutiOS', 'true');
                showIosCallout();
            }
        }

		// show filter panel
		$('#filter_button').click(function() {

    		// calculate the filter block height
    		resizeFilterBlock();

    		// slide down the filter block
            $("#filter_block").slideDown(400, function() {
                // hide the main content (map and list) by setting a height on the main container and hiding overflow
                setFilterContainer();
            });

            // show the correct buttons
            $('#filter_button').hide();
            $('#spacecount').hide();
            //$('#space_count_container').hide();
            $('#done-clear-group').show();
            $('#view_results_button').show();
            $('#cancel_results_button').show();

            // handle scrolling for android froyo or newer
    		if (android || gingerbreadOrNewer) {
        		touchScroll("filter_block");
    		}

        });

        // clear filters
        $('#cancel_results_button').click(function() {

            $('#filter-clear').slideDown(50);
            $('#filter-clear').delay(1000).fadeOut(500);
            // clear saved search options
            if ($.cookie('spacescout_search_opts')) {
                $.removeCookie('spacescout_search_opts');
            }

            // reset checkboxes
            $('input[type=checkbox]').each(function() {
                if ($(this).prop('checked')) {
                    $(this).prop('checked', false);
                    $(this).parent().removeClass("selected");
                }
            });

            // reset capacity
            $('#capacity').val('1');

            // reset hours
            $('#open_now').prop('checked', true);
            $('#open_now').parent().removeClass("selected");
            $('#hours_list_container').hide();
            $('#hours_list_input').parent().removeClass("selected");
            $("#day-until").val("No pref")
            $("#hour-until").val("No pref")
            $("#ampm-until").val("AM")
            default_open_at_filter();
            // reset location
            $('#entire_campus').prop('checked', true);
            $('#entire_campus').parent().removeClass("selected");
            $('#e9.building-location').children().children().first()[0].selected = true; // grabs first location in drop down and selects it
            $('#building_list_container').hide();
            $('#building_list_input').parent().removeClass("selected");
            $('#building_list_container').children().children().children(".select2-search-choice").remove();
            $('#building_list_container').children().children().children().children().val('Select building(s)');
            $('#building_list_container').children().children().children().children().attr('style', "");
        });

        // handle view details click
        $('.view-details').live('click', function(e){

            // get the space id
            id =  $(this).find('.space-detail-list-item').attr('id');

            e.preventDefault();

            //clear any unneded pending ajax window.requests
            for (i = 0; i < window.requests.length; i++) {
                window.requests[i].abort();
            }
            window.requests.push(
                $.ajax({
                    url: '/space/'+id+'/json/',
                    success: showSpaceDetails
                })
            );

        });

        // handle checkbox and radio button clicks
        $('.checkbox input:checkbox').click(function() {
            if(this.checked) {
                $(this).parent().addClass("selected");
            }
            else {
                $(this).parent().removeClass("selected");
            }
        });

        $('#filter_hours input:radio').change(function() {
            $(this).parent().addClass("selected");
            $(this).parent().siblings().removeClass("selected");

            if ($('#hours_list_input').is(':checked')) {
                $('#hours_list_container').show();
            }
            else {
                $('#hours_list_container').hide();
            }
        });

        $('#filter_location input:radio').change(function() {
            $(this).parent().addClass("selected");
            $(this).parent().siblings().removeClass("selected");

            if ($('#building_list_input').is(':checked')) {
                $('#building_list_container').show();
            }
            else {
                $('#building_list_container').hide();
            }

        });

        // Toggle between carousel and map
        $('.space-image-map-buttons button').live('click', function(e){

            if ($('#carouselControl').hasClass('active')) { // show the carousel
                $('#spaceCarouselContainer').show();
                $('#spaceMap').hide();
                $('#carouselControl.btn').attr("tabindex", -1).attr("aria-selected", true);
                $('#mapControl.btn').attr("tabindex", 0).attr("aria-selected", false);
            }
            else { //show the map
                $('#spaceCarouselContainer').hide();
                $('#spaceMap').show();
                getSpaceMap(detailsLat, detailsLon);
                $('#carouselControl.btn').attr("tabindex", 0).attr("aria-selected", false);
                $('#mapControl.btn').attr("tabindex", -1).attr("aria-selected", true);
            }
        });

	});

	// Update dimensions on orientation change
	$(m).bind('orientationchange', function() {

        landscape = (window.orientation) == 90 || (window.orientation == -90);

        setMobileContentHeights();
        resizeCarouselMapContainer();

        if ($('#filter_block').is(":visible")) {
    	   resizeFilterBlock();
    	   setFilterContainer();
        }

    });


	// set a height for main container and hide any overflowing
	function setFilterContainer() {

        var filterH = $(window).height();

        $('#container').height(filterH);
        $('#container').css({
            overflow: 'hidden',
        });
	}

	// Show space details
	function showSpaceDetails(data) {
    	// change url
    	location.href = '/space/' + data.id;
	}


	// ScrollTo a spot on the UI
	function scrollTo(id) {
        // Scroll
        $('html,body').animate({ scrollTop: $("#"+id).offset().top},'fast');
    }

    // Mobile display defaults
    function setMobileContentHeights() {

        var windowH = $(window).height();
        var headerH = $('#nav').height();
        var mapH = windowH - headerH;

        if (ipad) {
            if (landscape) {
                mapH = mapH - 150; // give plenty of room to show space list
            }
            else {
                mapH = mapH - 380; // give plenty of room to show space list
            }
        }
        else
        {
            mapH = mapH - 50; // enough to show the loading spinner at the bottom of the viewport
        }

        $('#map_canvas').height(mapH);
        $('#map_canvas').css({ minHeight: mapH })
        $('#info_list').height('auto');
    }

    function initializeCarousel() {

        // initialize the carousel
        $('.carousel').each(function() {

            $(this).carousel({
                interval: false
            });

            // add carousel pagination
            var html = '<div class="carousel-nav" data-target="' + $(this).attr('id') + '"><ul>';

            for(var i = 0; i < $(this).find('.item').size(); i ++) {
                html += '<li><a';
                if(i == 0) {
                        html += ' class="active"';
                }

                html += ' href="#">•</a></li>';
            }

            html += '</ul></li>';
            $(this).before(html);

            //set the first item as active
            $(this).find(".item:first-child").addClass("active");

            // hide the controls if only 1 picture exists
            if ($(this).find('.item').length == 1) {
                 $(this).find('.carousel-control').hide();
                 $(this).prev().hide(); // hide carousel pagination container for single image carousels
            }

        }).bind('slid', function(e) {
            var nav = $('.carousel-nav[data-target="' + $(this).attr('id') + '"] ul');
            var index = $(this).find('.item.active').index();
            var item = nav.find('li').get(index);

            nav.find('li a.active').removeClass('active');
            $(item).find('a').addClass('active');
        });

        $('.carousel-nav a').bind('click',
                function(e) {
                        var index = $(this).parent().index();
                        var carousel = $('#' + $(this).closest('.carousel-nav').attr('data-target'));

                        carousel.carousel(index);
                        e.preventDefault();
                }
        );

    }

    function resizeFilterBlock() {
        var winH = $(window).height();
        $("#filter_block").height(winH - 110);
    }

    function resizeCarouselMapContainer() {
        // get the width
        var containerW = $('.image-container').width();

        // calcuate height based on 3:2 aspect ratio
        var containerH = containerW / 1.5;

        $('.carousel').height(containerH);
        $('.carousel-inner-image').height(containerH);
        $('.carousel-inner-image-inner').height(containerH);
        $('.map-container').height(containerH);
    }

    // callout for ios5-6 native app
    function showIosCallout() {


        $('#ios_callout').show(0, function() {
            // Animation complete.
            $('.ios-inner-container').show("slide", { direction: "down" }, 700);
            // disable the iphone scroll
            document.ontouchmove = function(event){ event.preventDefault(); }
        });

        $('#continue_webapp').click(function() {
            // close the modal
            $('#ios_callout').hide();
            // enable scrolling
            document.ontouchmove = function(event){ return true; }
        });

        $('#download_native').click(function() {
            // redirect to app store
            window.location = "http://itunes.apple.com/us/app/spacescout/id551472160";
            // enable scrolling
            document.ontouchmove = function(event){ return true; }
        });
    }

    // enable div overflow scrolling for android
    function touchScroll(id) {

		var el=document.getElementById(id);
		var scrollStartPos=0;

		document.getElementById(id).addEventListener("touchstart", function(event) {
			scrollStartPos=this.scrollTop+event.touches[0].pageY;
		},false);

		document.getElementById(id).addEventListener("touchmove", function(event) {
			this.scrollTop=scrollStartPos-event.touches[0].pageY;
		},false);

    }

})(this);
