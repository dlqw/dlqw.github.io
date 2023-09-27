var a_idx = 0;
jQuery(document).ready(function($) {
  $("body").click(function(e) {
    var a = new Array("+1HP","+10HP","+100HP","-1HP","-10HP","-100HP","MISS");
    var $i = $("<span/>").text(a[a_idx]);
    var x = e.pageX,
      y = e.pageY;
    $i.css({
      "z-index": 99999,
      "top": y,
      "left": x - a[a_idx].length * 8,
      "position": "absolute",
      "color": "#ff7a45"
    });
    $("body").append($i);
    $i.animate({
      "top": y - 180,
      "opacity": 0
    }, 1500, function() {
      $i.remove();
    });
    a_idx = (a_idx + 1) % a.length;
  });
});
