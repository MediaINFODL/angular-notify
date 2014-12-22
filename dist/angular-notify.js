angular.module('cgNotify', ['ngSanitize']).factory('notify',['$timeout','$http','$compile','$templateCache','$rootScope','$sce',
    function($timeout,$http,$compile,$templateCache,$rootScope,$sce){

        var startTop = 10;
        var verticalSpacing = 15;
        var duration = 10000;
        var defaultTemplateUrl = 'angular-notify.html';
        var position = '';
        var container = document.body;
        var classes = '';
        var persistent = false;
        var single = false;
        var closable = false;
        // var toggleable = false;

        var messageElements = [];

        var notify = function(args){

            if (typeof args !== 'object'){
                args = {message:args};
            }

            args.templateUrl = args.templateUrl ? args.templateUrl : defaultTemplateUrl;
            args.position = args.position ? args.position : position;
            args.container = args.container ? args.container : container;
            args.classes = args.classes ? args.classes : classes;
            args.persistent = args.persistent ? args.persistent : persistent;
            args.duration = args.duration ? args.duration : duration;
            args.startTop = args.startTop ? args.startTop : startTop;
            args.single = args.single ? args.single : single;
            args.closable = args.closable ? args.closable : closable;
            // args.toggleable = args.toggleable ? args.toggleable : toggleable;

            if(args.single)
                args.classes += ' ns-single';

            var scope = args.scope ? args.scope.$new() : $rootScope.$new();
            scope.$message = args.message;
            scope.$classes = args.classes;
            scope.$messageTemplate = args.messageTemplate;
            scope.$persistent = args.persistent;
            scope.$closable = args.closable;

            $http.get(args.templateUrl,{cache: $templateCache}).success(function(template){

                var templateElement = $compile(template)(scope);
                templateElement.bind('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd', function(e){
                    if (e.propertyName === 'opacity' ||
                        (e.originalEvent && e.originalEvent.propertyName === 'opacity')){

                        templateElement.remove();
                        if(!args.single){
                            messageElements.splice(messageElements.indexOf(templateElement),1);
                            layoutMessages();
                        }
                    }
                });

                if (args.messageTemplate){
                    var messageTemplateElement;
                    for (var i = 0; i < templateElement.children().length; i ++){
                        if (angular.element(templateElement.children()[i]).hasClass('cg-notify-message-template')){
                            messageTemplateElement = angular.element(templateElement.children()[i]);
                            break;
                        }
                    }
                    if (messageTemplateElement){
                        messageTemplateElement.append($compile(args.messageTemplate)(scope));
                    } else {
                        throw new Error('cgNotify could not find the .cg-notify-message-template element in '+args.templateUrl+'.');
                    }
                }

                angular.element(args.container).append(templateElement);

                if(templateElement.hasClass('ns-effect-slide') && templateElement.hasClass('ns-bottomright')){
                    templateElement.css({ bottom: '-' + templateElement.outerHeight() + 'px', });
                }

                if(!args.single){
                    messageElements.push(templateElement);


                    if (args.position === 'center'){
                        $timeout(function(){
                            templateElement.css('margin-left','-' + (templateElement[0].offsetWidth /2) + 'px');
                        });
                    }
                }

                scope.$close = function(){
                    // if(!args.toggleable){

                        if(templateElement.hasClass('ns-effect-slide') && templateElement.hasClass('ns-bottomright')){
                            templateElement.css({ bottom: '-' + templateElement.outerHeight() + 'px', });
                        } else{
                            templateElement.css('opacity',0).attr('data-closing','true');
                        }

                        templateElement.removeClass("ns-show").addClass("ns-hide");
                        $timeout(function(){
                            // Remove HTML markup
                            templateElement.remove();
                            if(!args.single){
                                messageElements.splice(messageElements.indexOf(templateElement),1);
                                $('body').addClass('notice-box-closing');
                                setTimeout(function() { $('body').removeClass('notice-box-closing'); }, 250);
                                layoutMessages();
                            }
                        }, 500);
                    // } else{
                        // templateElement.css({
                        //     bottom: '-' + templateElement.outerHeight() + 'px',
                        // });
                        // templateElement.removeClass("ns-show").addClass("ns-hide");
                    // }


                };

                scope.$bindFullHTML = function(html){
                    return $sce.trustAsHtml(html);
                }


                var layoutMessages = function(){
                    var j = 0;
                    var currentY = args.startTop;
                    // for(var i = messageElements.length - 1; i >= 0; i --){
                    for(var i = 0; i < messageElements.length; i++){
                        var shadowHeight = 10;
                        var element = messageElements[i];
                        var height = element[0].offsetHeight;
                        var top = currentY + height + shadowHeight;
                        if (element.attr('data-closing')){
                            // top += 20;
                        } else {
                            currentY += height + verticalSpacing;
                        }

                        element.css('top',top + 'px').css('margin-top','-' + (height+shadowHeight) + 'px').css('visibility','visible');

                        j ++;
                    }
                };

                if(!args.single)
                    $timeout(function(){
                        layoutMessages();
                    });

                if (!args.persistent && args.duration > 0){
                    $timeout(function(){
                        scope.$close();
                    }, args.duration);
                }

            }).error(function(data){
                    throw new Error('Template specified for cgNotify ('+args.templateUrl+') could not be loaded. ' + data);
            });

            var retVal = {};

            retVal.close = function(){
                if (scope.$close){
                    scope.$close();
                }
            };

            Object.defineProperty(retVal,'message',{
                get: function(){
                    return scope.$message;
                },
                set: function(val){
                    scope.$message = val;
                }
            });

            return retVal;

        };

        notify.config = function(args){
            startTop = !angular.isUndefined(args.startTop) ? args.startTop : startTop;
            verticalSpacing = !angular.isUndefined(args.verticalSpacing) ? args.verticalSpacing : verticalSpacing;
            duration = !angular.isUndefined(args.duration) ? args.duration : duration;
            defaultTemplateUrl = args.templateUrl ? args.templateUrl : defaultTemplateUrl;
            position = !angular.isUndefined(args.position) ? args.position : position;
            container = args.container ? args.container : container;
            classes = args.classes ? args.classes : classes;
            persistent = args.persistent ? args.persistent : persistent;
            closable = args.closable ? args.closable : closable;
        };

        notify.closeAll = function(){
            for(var i = messageElements.length - 1; i >= 0; i --){
                var element = messageElements[i];
                element.css('opacity',0);
                element.removeClass("ns-show").addClass("ns-hide");
                $timeout(function(){
                    element.remove();
                }, 500);
            }
        };

        return notify;
    }
]);
