(function () {
/* main begin */

    var blockload = false;

    function sdvig(img)
    {
        var $gallery = $('.gallery');
        if (img.length)
        {
            var offsetLeft = $(img).offset().left;
            var z =$gallery.scrollLeft()-($(window).width()/2-$(img).width()/2-offsetLeft);
            $gallery.animate({ scrollLeft: z}, 500);
        }
    }

    function getIdByHash(hash)
    {
        var reg = /id=(\d+)/;
        var r = reg.exec(hash);
        console.log('getByHash r=',r);
        if (r)
        {
            if (r[1])
            {
                console.log('getIdByHash = ',r[1]);
                return r[1];
            }
            else return false;
        }
        else
        {
            console.log('getIdByHash = NO');
            return false;
        }
    }
    /*
    * @param {Number} next
    * */
    function loadTiles(next,self,firstid,c)
    {
        if (blockload == false)
        {
            c = c || 0;
            firstid = firstid || false;
            blockload = true;
            console.log('require loadTiles()');
            if (firstid === false)
            {
                var $tiles = $('.tiles');
                var tiles_length = Number($tiles.length);
                console.log('tile_length=',tiles_length);
                var id = '';
                var $last;
                if ($tiles.length == 0)
                {
                    id = 0;
                    console.log('*** tiles.length = 0');
                }
                else
                {
                    if (next === 1)
                    {
                        $last = $('.tiles').eq(tiles_length-1);
                        id = $last.attr('data-id');
                    }
                    else
                    {
                        $last = $tiles.eq(0);
                        id =  $last.attr('data-id'); next = 0;
                    }
                    console.log( '*** $last = ',$last);
                }
            }
            else {
                id = firstid;
            }
            var count = Math.ceil($(window).width()/200)+c;
            var ddd = $.Deferred();
            ddd.done(function(l)
            {
                if (!self)
                {
                    var vv = 0;
                    if (next === 1)
                    {
                        console.log('next===1');
                        //vv = $('.gallery').scrollLeft()+l*100;
                        //$('.gallery').animate({scrollLeft:vv},1);
                    }
                    else
                    {
                        vv = $('.gallery').scrollLeft()+l*100;
                        $('.gallery').scrollLeft(vv);
                    }
                }

            });

            getNextTilesById(id,count,next,self).pipe(function(result){
                blockload = false;
                console.log('in loadTiles result=',result);
                for (var i in result)
                {
                    console.log('obj.id=',result[i].id,' obj.s_link=',result[i].s_link);
                    var $readyTiles = 0;

                    $readyTiles = $('<div/>',{
                        class:'tiles',
                        'data-id': result[i].id,
                        'data-l_link': result[i].l_link,
                        'style': 'background-image: url("'+result[i].s_link+'")'
                    });
                    var $td = $('<td/>').append($readyTiles);
                    if (next === 1) {$td.appendTo($('.row'));}
                    else {$td.prependTo($('.row'));}
                }
                ddd.resolve(result.length);
            });
        }
        else
        {
            console.log('blockload = true');
        }
        return  ddd.promise();
    }
    function getNextTilesById(id,count,next,self){
        console.log('require getNextTilesById()');
        var url = 'server.js?f=getnexttilesbyid&id='+id+'&count='+count+'&next='+next+'&self='+self;
        var dd = $.Deferred();
        $.getJSON(url,function(data){
            dd.resolve(data);
        });
        return dd.promise();
    }
    function getPhotoById(id){
        var url = 'server.js?f=getphotobyid&id='+id;
        var dd = $.Deferred();
        var result = [];
        $.getJSON(url,function(data){
            dd.resolve(data);
        });
        return dd.promise();
    }
    $(function () {
        /* page load */
        var $window = $(window);
        var $doc = $(document);
        var $main = $('.main');
        var $gallery = $('.gallery');
        var hovergallery = false;
        var $table_gallery = $('.table_gallery');

        $gallery.hover(function(){
            hovergallery = true;
            $table_gallery.animate({bottom:'20px'},400);
        },function(){
            hovergallery = false;
            $table_gallery.animate({bottom:'-200px'},400);
        });



        $main.bind('mousewheel  DOMMouseScroll',function(e){
            if (hovergallery)
            {
                if (e.type == 'mousewheel')
                {
                    /*console.log('wheelDeltaYdelta=', e.originalEvent.wheelDeltaY);
                     console.log('e=',e);
                     console.log('wheelDelta=',e.originalEvent.wheelDelta);*/
                    if (e.originalEvent.wheelDeltaY<0) {$gallery.trigger('scroll_right');}
                    else {$gallery.trigger('scroll_left');}
                }
                else
                {
                    /* firefox */
                    /*console.log('mozilla',e.originalEvent.detail);  */
                    if (e.originalEvent.detail<0) {$gallery.trigger('scroll_left');}
                    else {$gallery.trigger('scroll_right');}
                }
            }
            e.preventDefault();
            //$(this).trigger('scrolling');
        })
            .bind('gallery_replace',function(){
                $gallery.css({bottom:($('.main').height()-$(window).height()-20)+'px'});
            });
        $gallery.bind('scroll_left',function(){
            console.log('gallery bind scroll_left');
            $('.gallery').scrollLeft($('.gallery').scrollLeft()-40);
            })
            .bind('scroll_right',function(){
                console.log('gallery bind scroll_right');
                $('.gallery').scrollLeft($('.gallery').scrollLeft()+40);
                })
            .bind('scroll',function(){
                console.log('gallery bind Scroll');
                if ($('.gallery').scrollLeft() == 0)
                {
                    console.log(' even load left');
                    loadTiles(0,0);
                }
                else if ($('.gallery').scrollLeft() >= ($('.table_gallery').width()-$(window).width()))
                {
                    console.log(' even load right');
                    loadTiles(1,0);
                }

            });
        $window.resize(function(){
            $window = $(window);
        });



        console.log('start');

        var currentId = getIdByHash(location.hash);
        console.log('currentId=',currentId);
        if (currentId === false) currentId = 0;
        $main.trigger('gallery_replace');
        loadTiles(1,1,currentId,Math.ceil($(window).width()/200)).pipe(function(){
            if (currentId)
            {
                var $cur = $('.tiles[data-id='+currentId+']');
                sdvig($cur);
                $cur.addClass('current');
            }
            else
            {
                var $cur = $('.tiles').eq(0);
                $cur.addClass('current');
                $gallery.scrollLeft(0);
                $gallery.animate({screenLeft:10},400);
            }
        });

        $main.delegate('.tiles','click',function(){
            $('.current').removeClass('current');
            $(this).addClass('current');
            sdvig($(this));
        });

        /* end page load */
    });
/* main end */
}());