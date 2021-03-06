
$(function () {
    'use strict';

     internalLink.init();
     fabPageTop.init();

    // Background-images
    $('[data-background]').each(function () {
        $(this).css({
            'background-image': 'url(' + $(this).data('background') + ')'
        });
    });


    // Accordions
    $('.collapse').on('shown.bs.collapse', function () {
        $(this).parent().find('.ti-plus').removeClass('ti-plus').addClass('ti-minus');
    }).on('hidden.bs.collapse', function () {
        $(this).parent().find('.ti-minus').removeClass('ti-minus').addClass('ti-plus');
    });


    

});

var internalLink = (function () {
    return {
        init: function () {
            $("[data-role=internalLink]").each(function () {

                var self = $(this);
                var target = $(self).attr("data-internallink-target");
                self.on("click", function (e) {
                    e.preventDefault();
                    if ($(target).length > 0) {
                        $("html, body").animate({ scrollTop: $(target).offset().top - 80 }, 500, "swing");
                    } else {
                        $("html,body").stop().animate({
                            scrollTop: 0
                        }, 500, "swing");
                    }
                });

            });
        }
    }
})();
var fabPageTop = (function () {
    return {
        init: function () {
            if ($(".fabPageTop").length) {
                var fab = $(".fabPageTop")[0];
                var entry = $(".articleToC")[0];
                (new IntersectionObserver(function (entries, observer){   
                    if (entries[0].isIntersecting) {
                        $(fab).removeClass("active");
                    } else {
                        $(fab).addClass("active");
                    }
                    
                }).observe(entry));
            }
        }
    }
})();