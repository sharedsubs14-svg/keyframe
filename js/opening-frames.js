/* The opening scene's photographs. Each frame is one real photo split into two layers:
   plate = the world with the person removed, subject = the person cut out.
   "use" is the frame the site opens with: 'boxer' or 'platform'. "review: true" brings back a small switcher to compare them; keep it false on the live site. */
window.SLATE_OPENING = {
  use: 'boxer',
  review: false,
  frames: {
    boxer: {
      label: '4 · boxer',
      plate: 'img/open/boxer-plate.jpg', subject: 'img/open/boxer-subject.webp',
      box: [43.51, 20.05, 15.87, 79.95],            // where the person sits in the photo: left, top, width, height, in %
      light: [50, 4.2],                             // where the light sits in the photo, in %
      bars: false,                                  // the lamp sits at the very top, so no cinema bars over it
      looks: { dull: 'saturate(.1) brightness(.42)', lit: 'saturate(.6) brightness(1.6) contrast(.76)', hour: 'saturate(.8) brightness(1.1) contrast(.9)' },
      subjectLooks: { flat: [.06, .72, .85], lit: [.6, 1.5, .8], hour: [.8, 1.1, .9] },   // saturate, brightness, contrast
      lines: [['Who is in the frame?', 'one boxer, alone in the ring'], ['Where does the light come from?', 'straight above. one hard lamp.'], ['Where does the camera stand?', 'eye level, on a 35mm'], ['What hour is it?', 'past midnight. the gym is empty.'], ['What should it feel like?', 'cold fury. a noir.']],
      tags: { S: ['subject · one boxer, alone', -334, -20, 's'], L: ['key · top light · hard', 30, -176, 'b'], A: ['35mm · eye level', -334, 150, 'g'], T: ['past midnight', 334, 150, 'b', 'r'], E: ['cold fury · noir', -334, -176, 'g'] },
      outline: 'M1024 241 L1014 251 L1002 254 L999 257 L995 271 L987 277 L986 303 L988 308 L986 314 L990 339 L998 351 L999 366 L996 369 L974 376 L925 401 L916 413 L906 446 L906 496 L902 515 L904 566 L901 582 L900 640 L905 673 L904 717 L907 742 L902 774 L908 788 L926 807 L924 834 L935 840 L944 849 L953 912 L952 945 L944 973 L947 1038 L942 1048 L949 1087 L939 1099 L944 1102 L941 1114 L947 1113 L949 1116 L941 1133 L927 1151 L995 1151 L995 1138 L991 1127 L991 1106 L993 1102 L993 1079 L997 1063 L997 1039 L1007 1004 L1007 951 L1021 914 L1021 883 L1025 857 L1032 848 L1043 841 L1044 820 L1049 798 L1053 803 L1058 823 L1058 837 L1061 844 L1081 855 L1087 863 L1096 894 L1100 918 L1120 962 L1126 1013 L1140 1048 L1140 1061 L1151 1102 L1153 1135 L1150 1151 L1205 1151 L1194 1125 L1194 1119 L1200 1117 L1203 1112 L1192 1093 L1195 1048 L1189 1039 L1187 981 L1171 935 L1167 893 L1170 847 L1183 834 L1177 795 L1191 784 L1200 765 L1199 750 L1193 728 L1195 714 L1195 675 L1193 672 L1196 644 L1195 605 L1187 553 L1187 510 L1179 468 L1179 435 L1173 413 L1162 394 L1112 370 L1103 368 L1095 362 L1089 344 L1095 327 L1096 313 L1094 305 L1096 298 L1093 292 L1094 278 L1086 268 L1085 258 L1070 251 L1067 244 L1061 240 L1048 243 Z'
    },
    platform: {
      label: '1 · platform',
      plate: 'img/open/platform-plate.jpg', subject: 'img/open/platform-subject.webp',
      box: [31.98, 19.1, 10.89, 50.26],
      light: [22.7, 17.4],
      focus: 38,                                    // on phones, keep this part of the photo (in % from the left) in the middle
      bars: true,
      looks: { dull: 'saturate(.1) brightness(.5) contrast(.9)', lit: 'saturate(.3) brightness(1.12) contrast(.92)', hour: 'saturate(.75) brightness(1.04) contrast(.88)' },
      subjectLooks: { flat: [.06, .8, .82], lit: [.3, 1.12, .92], hour: [.75, 1.04, .88] },
      lines: [['Who is in the frame?', 'one woman, a suitcase, waiting'], ['Where does the light come from?', 'low sun, cutting through the columns'], ['Where does the camera stand?', 'low and far back, on an 85mm'], ['What hour is it?', 'dawn. the first train.'], ['What should it feel like?', 'longing. a slow drama.']],
      tags: { S: ['subject · woman, waiting', -36, -60, 's'], L: ['key · low sun · backlit', -334, -132, 'b'], A: ['85mm · low angle', -334, 104, 'g'], T: ['dawn', 334, 104, 'b', 'r'], E: ['longing · drama', 334, -132, 'g', 'r'] },
      outline: 'M800 229 L790 229 L778 233 L770 240 L758 257 L746 262 L744 287 L753 292 L755 298 L740 315 L720 328 L711 340 L706 363 L708 377 L705 404 L705 477 L707 493 L701 554 L696 559 L675 560 L669 566 L668 607 L664 633 L668 639 L693 643 L696 646 L697 665 L712 668 L716 672 L717 691 L715 703 L718 712 L718 731 L710 757 L710 764 L713 768 L728 773 L733 787 L781 789 L824 786 L857 777 L857 746 L847 668 L850 665 L867 664 L868 650 L851 535 L850 512 L853 502 L845 471 L845 432 L825 349 L793 311 L797 306 L807 310 L814 309 L828 290 L826 278 L829 272 L831 253 L829 248 L814 235 Z'
    }
  }
};
