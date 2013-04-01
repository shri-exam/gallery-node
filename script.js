(function () {
/* main begin */

    var blockload = false; /* блок загрузки изображений */
    var touch_e = 0;  /* тачскрин  , по умолчанию 0*/

    /*
    * @param {jQuery} $img
    * @return {promise}
    *
    * загружает большую картинку
    * и выводит в лайтбокс
    *
    * */
    function loadAndRender($img)
    {
        var lr = $.Deferred();
        sdvig($img).pipe(function(oldIndex,newIndex,$img){

            /*console.log('olad=',oldIndex,' new=',newIndex,' img=',$img); */
            $('.main').trigger('spiner_show');
            loadImg($img).pipe(function($newimg){
                /*console.log('newimg=',$newimg); */
                $('.main').trigger('spiner_hide');
                renderLightbox($newimg,oldIndex,newIndex).pipe(function(){
                    lr.resolve();
                });
            });

            $('.current').removeClass('current');
            $img.addClass('current');
            $(window).trigger('change_hash');
        });
        return lr.promise();
    }

    /*
    * @param {jQuery} $img
    * @return {promise} - resolve ({jQuery} $img)
    *
    * меняет ширины и высоту , а так же
    * css (top , left)
    *
    * */
    function resizeImage($img)
    {
        $window = $(window);
        var rs = $.Deferred();
        /*console.log('resize height=',$img,' width=',$img.width());   */
        /*
         * Требуемая высота и ширина
         * если тачскрин - то высота меньше на touch_e
         * */
        var reqheight = ($window.height()-(10+touch_e));
        var reqwidth = $window.width()-10;
        /*console.log('reqH=',reqheight,' reqW=',reqwidth);*/
        if ($img.attr('data-height')<reqheight && $img.attr('data-width')<reqwidth)
        {
            /*
             *  Если оригинал меньше - выводим как есть
             *
             */
            $img.height($img.attr('data-height'));
            $img.width($img.attr('data-width'));

        }
        else
        {
            /*console.log('change'); */
            var tempHeight = $img.attr('data-height');
            var tempWidth = $img.attr('data-width');

            /*
             * Высчитываем новые пропорции исходя из новой
             * ширины или высоты
             * п.с. Для планшетов - не масштабирует авто-и.
             * */
            if (reqheight<reqwidth)
            {
                $img.height(reqheight);
                $img.width(tempWidth*reqheight/tempHeight);
            }
            else
            {
                $img.width(reqwidth);
                $img.height(tempHeight*reqwidth/tempWidth);
            }
        }
        $($img).css({
            'left': ($(window).width()-($img).width())/2,
            'top': ($(window).height()-(($img).height()+touch_e))/2
        });
        /*console.log('before resolve =',$img) */
        rs.resolve($img);
        return rs.promise();
    }
    /*
    * @param {jQuery} $img
    * @return {promise} - resolve ({jQuery} $img)
    *
    * загружает новое большое изображение
    *
    * */
    function loadImg($img)
    {
        var ld = $.Deferred();
        if ($img.length)
        {
            var $tilesImage = $img.eq(0);
            var $newImg = $('<img/>',
                {
                    class:'lightbox',
                    src: $tilesImage.attr('data-l_link'),
                    'data-width': $tilesImage.attr('data-width'),
                    'data-height': $tilesImage.attr('data-height')
                });
            $newImg.load(function(){
                /*console.log('this height=',$(this).prop('height')); */
                ld.resolve($(this));
            });
        }
        else {ld.resolve(false);}
        return ld.promise();
    }
    /*
    * @param {jQuery}  img, {Number} oldInvex, {Number} newIndex
    * @return {promise}
    *
    * меняет изображение в лайтбоксе
    *
    * */
    function renderLightbox($img,oldIndex,newIndex)
    {
        /*console.log('render img=',$img,' old=',oldIndex,' new=',newIndex);*/
        var rl = $.Deferred();
        if ($img)
        {
            resizeImage($img).pipe(function($img){
                /*console.log('after resize img=',$img); */
                console.log(' oldIndex=',oldIndex);
                if (oldIndex == -1 || oldIndex == newIndex || $('.lightbox').length == 0)
                {
                    console.log('prost vyvod');
                    /* **************************** */
                    imageSlide($img,1,1).pipe(function(){
                        rl.resolve();
                    });
                }
                else if (oldIndex < newIndex)
                {
                    console.log(' <<<  vyvod');
                    imageSlide($('.lightbox'),0,0).pipe(function($old){
                        $old.remove();
                        $img.appendTo('.main');
                        imageSlide($img,1,1).pipe(function(){
                            rl.resolve();
                        });
                    })
                }
                else
                {
                    /*console.log('>>> vyvod'); */
                    imageSlide($('.lightbox'),0,1).pipe(function($old){
                        $old.remove();
                        $img.appendTo('.main');
                        imageSlide($img,1,0).pipe(function(){
                            rl.resolve();
                        });
                    })
                }
            });
        }
        return rl.promise();
    }
    /*
    * @param {jQuery} $img, {Number} show, {Number} right
    * return {promise} - resolve ({jQuery} $img)
    *
    * Двигает изображение (слайдер)
    * show - 1 показывает, 0 - скрывает
    * right - 1 пролистывание справа, 0 - слева
    *
    * */
    function imageSlide($img,show,right)
    {
        console.log('image Slide $img=',$img,' show=',show,' right=',right);
        var is = $.Deferred();
        if (right ===1) {var r = '200%';} else {var r = '-200%';}
        if (show === 0)
        {
            console.log('goin HIDE');
            $img.animate({
                    left:r},300,function(){
                    is.resolve($(this));
                $img.remove()
            });
        }
        else
        {
           console.log('goin show');
            console.log('going show');
            $img.appendTo('.main').css(
                {/*top:(($(window).height()-($img.height()+touch_e))/2),*/
                    left:r,
                    opacity:'1'
                })
                .animate({left:(($(window).width()-$img.width())/2)},300,function(){
                is.resolve($(this));
            });
        }
        return is.promise();
    }
    /*
    * @param {jQuery} $img
    * @return {promise} - resolve ({Number} oldIndex, {Number} newIndex, {jQuery} $img)
    * Двигает скрол галереи и возвращает
    * старый и новый индекс активной картинки
    *
    * */
    function sdvig($img)
    {
        /*console.log('sdvig img=',$img);*/
        var sdv = $.Deferred();
        var $tiles = $('.tiles');

        var oldIndex = $tiles.index($('.current'));
        var newIndex = $tiles.index($img);

        var $gallery = $('.gallery');
        if ($img.length)
        {
            var offsetLeft = $img.offset().left;
            var z =$gallery.scrollLeft()-($(window).width()/2-$img.width()/2-offsetLeft);
            $gallery.animate({ scrollLeft: z}, 500);
        }
        console.log(' peredaem oldIndex=',oldIndex,' newIndex=',newIndex);
        sdv.resolve(oldIndex,newIndex,$img);

        return sdv.promise();
    }
    /*
    * @param {string} hash
    * @return {string}
    *
    * Парсинг location.hash
    *
    * */
    function getIdByHash(hash)
    {
        var reg = /id=(\d+)/;
        var r = reg.exec(hash);
        if (r)
        {
            if (r[1])
            {
                return r[1];
            }
            else return false;
        }
        else
        {
            return false;
        }
    }
    /*
    * @param {Number} next, {Number} self [,{String} firstid] [,{Number} c]
    * @return {promise} - resolve ({Number} - result.length)
    *
    * Подгружает картинки
    * next = 1  - загржаем после последней , next = 0 - перед первой
    * self = включая себя или нет.
    * firstid - с какой начать (по умолчанию первая или последняя в галереи)
    * с - увеличение подгружаемых картинок на величину с
    *
    * */
    function loadTiles(next,self,firstid,c)
    {
        if (blockload == false)
        {
            c = c || 0;
            firstid = firstid || false;
            blockload = true;
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

                    }
                    else
                    {
                        vv = $('.gallery').scrollLeft()+l*100;
                        $('.gallery').scrollLeft(vv);
                    }
                }
                blockload = false;

            });

            getNextTilesById(id,count,next,self).pipe(function(result){

                console.log('in loadTiles result=',result);
                for (var i in result)
                {
                    console.log('obj.id=',result[i].id,' obj.s_link=',result[i].s_link);
                    var $readyTiles = 0;

                    $readyTiles = $('<div/>',{
                        class:'tiles',
                        'data-id': result[i].id,
                        'data-l_link': result[i].l_link,
                        'data-width': result[i].width,
                        'data-height': result[i].height,
                        'style': 'background-image: url("'+result[i].s_link+'")'
                    });
                    var $td = $('<td/>').append($readyTiles);
                    if (next === 1) {$td.appendTo($('.row'));}
                    else {$td.prependTo($('.row'));}
                }
                ddd.resolve(result.length);
            });
            return  ddd.promise();
        }
        else
        {
            console.log('blockload = true');
        }

    }
    /*
    * @rapam {string} id, {Number} count, {Number} next, {Number} self
    * @return {promise} - resolve ({Array} result)
    *
    * Возвращает массив обьектов с новыми изображениями tiles
    *
    * */
    function getNextTilesById(id,count,next,self){
        console.log('require getNextTilesById()');
        var url = 'server.js?f=getnexttilesbyid&id='+id+'&count='+count+'&next='+next+'&self='+self;
        var dd = $.Deferred();
        $.getJSON(url,function(data){
            dd.resolve(data);
        });
        return dd.promise();
    }

    $(function () {
        /* page load */
        var $window = $(window);
        var $main = $('.main');
        var $gallery = $('.gallery');
        var hovergallery = false;
        var $table_gallery = $('.table_gallery');


        /* обработчики событий */
        $gallery
            .hover(function(){
                hovergallery = true;
                $table_gallery.animate({bottom:'20px'},800);
                },function(){
                hovergallery = false;
                if (touch_e <= 0)
                {
                    $table_gallery.animate({bottom:'-200px'},800);
                }
            })
            .bind('scroll_left',function(){
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

            })
            .bind('right_30',function(){
                $(this).animate({scrollLeft:($(this).scrollLeft()+30)},300);
            });


        $main.bind('mousewheel  DOMMouseScroll',function(e){
            if (hovergallery)
            {
                if (e.type == 'mousewheel')
                {
                    if (e.originalEvent.wheelDeltaY<0) {$gallery.trigger('scroll_right');}
                    else {$gallery.trigger('scroll_left');}
                }
                else
                {
                    /* firefox */
                    if (e.originalEvent.detail<0) {$gallery.trigger('scroll_left');}
                    else {$gallery.trigger('scroll_right');}
                }
            }
            e.preventDefault();
        });





        $('body').hover(function(){$('.krug').animate({opacity:'0.5'},300);},
            function(){$('.krug').animate({opacity:'0'},300);})

        $window
            .resize(function(){
                var $l = $('.lightbox').eq(0);
                $l.siblings().filter('.lightbox').remove();
                resizeImage($l);
            })
            .one('touchmove',function(){
                $gallery.unbind('hover');
                touch_e = $('.gallery').height()+10;
                $window.trigger('resize');
                $table_gallery.animate({bottom:'20px'},800);

            })
            .bind('change_hash',function(){
            location.hash = 'id='+$('.current').eq(0).attr('data-id');
            })
            .one('load_first',function(){
                /* first image lightbox */
                var h = getIdByHash(location.hash);
                if (h)
                {
                    console.log('load h');
                    loadAndRender($('.tiles[data-id='+h+']')).pipe(function(){
                        //$gallery.trigger('right_30');
                        sdvig($('.current'));
                    });
                }
                else
                {
                    console.log('load first');
                    loadAndRender($('.tiles').eq(0)).pipe(function(){
                        $gallery.trigger('right_30');
                    });
                }
            })
            .one('load_tiles_first',function(){
                var count =  Math.ceil($(window).width()/200);
                loadTiles(1,1,currentId,count).pipe(function(){
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


                    if ($('.tiles').length < count)
                    {
                        loadTiles(0,0,currentId,count).pipe(function(){
                            $window.trigger('load_first');
                        });
                    }
                    else
                    {
                        $window.trigger('load_first');
                    }
                });
            });
        $main
            .delegate('.tiles','click',function(){
                loadAndRender($(this));
            })
            .delegate('.lightbox','click',function(){$('.lightbox').remove();})
            .bind('spiner_show',function(){
                $('<div/>',{class:'spiner'}).css(
                    {
                        left:(($(window).width()-(200+touch_e))/2),
                        top:(($(window).height()-(200+touch_e))/2)
                    })
                    .appendTo('.main');
            })
            .bind('spiner_hide',function(){
                $('.spiner').remove();
            })
            .delegate('spiner','click',function(){
                console.log('delegate click trigger hide');
                $main.trigger('spiner_hide');
            });



        $('.krug_next').click(function(){
            var $tiles = $('.tiles');
            var ind = $tiles.index($('.current'));
            if (ind == ($tiles.length-1))
            {
                loadTiles(0,0).pipe(function(){
                    var $tiles = $('.tiles');
                    var ind = $tiles.index($('.current'));
                    console.log('*** NEXT - MORE ind=',ind);
                    if (ind != ($tiles.length-1))
                    {
                        ind++;
                        loadAndRender($tiles.eq(ind));
                    }
                });
            }
            else
            {
                ind++;
                loadAndRender($tiles.eq(ind));
            }
        });
        $('.krug_prep').click(function(){
            var $tiles = $('.tiles');
            var ind = $tiles.index($('.current'));
            ind--;
            if (ind <= 0)
            {
                loadTiles(0,0).pipe(function(){
                    var $tiles = $('.tiles');
                    var ind = $tiles.index($('.current'));
                    console.log('*** ESHE RAZ ind=',ind);
                    if (ind !=0)
                    {
                        ind--;
                        loadAndRender($tiles.eq(ind));
                    }
                });
            }
            else
            {
                loadAndRender($tiles.eq(ind));
            }

        });
        $('.krug').hover(function()
        {
            $(this).animate({opacity:'1'},300);
        },function()
        {
            $(this).animate({opacity:'0.5'},300);
        });

        var currentId = getIdByHash(location.hash);
        if (currentId === false) currentId = 0;
        $main.trigger('gallery_replace');
        $window.trigger('load_tiles_first');

        /* end page load */
    });
/* main end */
}());