<?php
/*****************************************************************************
 *
 * std_speedometer.php - Sample gadget for NagVis
 *
 * Copyright (c) 2004-2008 NagVis Project (Contact: lars@vertical-visions.de)
 *
 * License:
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 *****************************************************************************
 *
 * This is a simple gadget for NagVis. A gadget is a script which generates a
 * dynamic image for visualizing things as graphics in NagVis.
 *
 * The gadget gets it's data from the NagVis frontend by parameters. This
 * gadget only needs the "perfdata" parameter. NagVis also proceeds the
 * following parameters to the gadgets:
 *  - name1:     Hostname
 *  - name2:     Service description
 *  - state:     Current state
 *  - stateType: Current state type (soft/hard)
 *
 *****************************************************************************/

/**
 * parsePerfdata() prases a Nagios performance data string to an array
 *
 * Function adapted from PNP process_perfdata.pl. Thanks to Jörg Linge.
 * The function is originaly taken from from Nagios::Plugin::Performance
 * Thanks to Gavin Carr and Ton Voon
 *
 * @param   String  Nagios performance data
 * @return  Array   Array which contains parsed performance data informations
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function parsePerfdata($sPerfdata) {
	$aMatches = Array();
	$aPerfdata = Array();
	
	// Cleanup
	$sPerfdata = str_replace(',', '.', $sPerfdata);
	$sPerfdata = preg_replace('/\s*=\s*/', '=', $sPerfdata);
	
	// Nagios::Plugin::Performance
	$sTmpPerfdata = $sPerfdata;
	
	// Parse perfdata
	preg_match_all('/([^=]+)=([\d\.\-]+)([\w%]*);?([\d\.\-:~@]+)?;?([\d\.\-:~@]+)?;?([\d\.\-]+)?;?([\d\.\-]+)?\s*/', $sPerfdata, $aMatches, PREG_SET_ORDER);
	
	// When no match found
	if(!isset($aMatches[0])) {
		errorBox('ERROR: Found no valid performance data in string');
	}
	
	for($i = 0, $len = sizeof($aMatches); $i < $len; $i++) {
		$aTmp = $aMatches[$i];
		
		/* Cleanups needed? Gues no.
		$p{label} =~ s/['\/\\]//g;    # cleanup
		
		if ( $p{uom} eq "%" ) {
				$p{uom} = "%%";
				print_log( "DEBUG: UOM adjust = $p{uom}", 3 );
		}*/
		
		// Check for warning and critical ranges
		/*$aMatch = Array();
		if($aTmp[3] && preg_match_all('/^([\d\.~@]+)?:([\d\.~@]+)?$/', $aTmp[3], $aMatch)) {
			$p{warning_min} = $1;
			$p{warning_max} = $2;
			delete( $p{warning} );
			if ( $p{warning_min} =~ /^@/ ) {
				$p{warning_min} =~ s/@//;
				$p{warning_range_type} = "inside";
			}
			else {
				$p{warning_range_type} = "outside";
			}
		}
		if ( $p{critical} && $p{critical} =~ /^([\d\.~@]+)?:([\d\.~@]+)?$/ ) {
		print_log( "DEBUG: Procesing critical ranges ( $p{critical} )", 3 );
		$p{critical_min} = $1;
		$p{critical_max} = $2;
		delete( $p{critical} );
		if ( $p{critical_min} =~ /^@/ ) {
		$p{critical_min} =~ s/@//;
		$p{critical_range_type} = "inside";
		}
		else {
		$p{critical_range_type} = "outside";
		}
		}*/
		
		// Save needed values
		$aSet = Array('label' => $aTmp[1], 'value' => $aTmp[2]);
		
		// Save optional values
		if(isset($aTmp[3])) {
			$aSet['uom'] = $aTmp[3];
		} else {
			$aSet['uom'] = null;
		}
		if(isset($aTmp[4])) {
			$aSet['warning'] = $aTmp[4];
		} else {
			$aSet['warning'] = null;
		}
		if(isset($aTmp[5])) {
			$aSet['critical'] = $aTmp[5];
		} else {
			$aSet['critical'] = null;
		}
		if(isset($aTmp[6])) {
			$aSet['min'] = $aTmp[6];
		} else {
			$aSet['min'] = null;
		}
		if(isset($aTmp[7])) {
			$aSet['max'] = $aTmp[7];
		} else {
			$aSet['max'] = null;
		}
		
		$aPerfdata[] = $aSet;
	}
	
	return $aPerfdata;
}

/**
 * Prints out an error box
 *
 * @param	String	$msg	String with error message
 * @author 	Lars Michelsen <lars@vertical-visions.de>
 */
function errorBox($msg) {
	$img = imagecreate(400,40);
	
	$bgColor = imagecolorallocate($img, 255, 255, 255);
	imagefill($img, 0, 0, $bgColor);
	
	$fontColor = imagecolorallocate($img, 10, 36, 106);
	imagestring($img, 2, 8, 8, $msg, $fontColor);
	
	imagepng($img);
	imagedestroy($img);
	exit;
}



/*******************************************************************************
 * Start gadget main code
 ******************************************************************************/

header("Content-type: image/png");

//==========================================
// Set Minimum, Default, and Maximum values.
//==========================================

$min = 0;
$max = -1;
$default = 0; 
 
/* Now read the parameters */

$aOpts = Array('name1', 'name2', 'state', 'stateType', 'perfdata');
$aPerfdata = Array();

/**
 * Needed:
 *  perfdata=load1=0.960;5.000;10.000;0; load5=0.570;4.000;6.000;0; load15=0.540;3.000;4.000;0;
 *
 * Optional
 *  name1=localhost
 *  name2=Current Load
 *  state=OK
 *  stateType=HARD
 */

if(isset($_GET['perfdata']) && $_GET['perfdata'] != '') {
	$aOpts['perfdata'] = $_GET['perfdata'];
} else {
	errorBox('ERROR: The needed parameter "perfdata" is missing.');
}

if(isset($_GET['name1']) && $_GET['name1'] != '') {
	$aOpts['name1'] = $_GET['name1'];
}

if(isset($_GET['name2']) && $_GET['name2'] != '') {
	$aOpts['name2'] = $_GET['name2'];
}

if(isset($_GET['state']) && $_GET['state'] != '') {
	$aOpts['state'] = $_GET['state'];
}

if(isset($_GET['stateType']) && $_GET['stateType'] != '') {
	$aOpts['stateType'] = $_GET['stateType'];
}

/* Now parse the perfdata */
$aPerfdata = parsePerfdata($aOpts['perfdata']);

// This gadget is simple and dirty, it only recognizes the first dataset of
// performance data

$value = $aPerfdata[0]['value'];
$warn = $aPerfdata[0]['warning'];
$crit = $aPerfdata[0]['critical'];
$min = $aPerfdata[0]['min'];
$max = $aPerfdata[0]['max'];

//================
// Normalize / Fix value and max
//================

if($value == null) {
	$value = $default;
} else {
	if($max != '' && $value < $min) {
		$value = $min;
	} elseif($max != '' && $max != -1 && $value > $max) {
		$value = $max;
	}
}

if ($max == 0) {
	$max = $crit + 1;
}

//================
// Calculate degrees of value, warn, critical
//================

$p = 180 / $max * $value;
$warnp = -180 + (180 / $max * $warn);
$critp = -180 + (180 / $max * $crit);

/**
 * Don't change anything below (except you know what you do)
 */

//==================
// Set image sizing.
//==================

$imgwidth = 220;
$imgheight = 110;
$innerdia = 0;
$outerdia = 150;
$linedia = 160;
$linewidth = 3;
$centerx = $imgwidth / 2;
$centery = $imgheight - 20;
$innerrad = $innerdia / 2;
$outerrad = $outerdia / 2-1;
$linerad = $linedia / 2;
$lineext = $linewidth/2;

//====================
// Create tacho image.
//====================

$img=imagecreatetruecolor($imgwidth, $imgheight);

$oBackground = imagecolorallocate($img, 122, 23, 211);
$oBlack = imagecolorallocate($img, 0, 0, 0);
$oGreen = imagecolorallocate($img, 0, 255, 0);
$oYellow = imagecolorallocate($img, 255, 255, 0);
$oRed = imagecolorallocate($img, 255, 0, 0);
$oBlue = imagecolorallocate($img, 0, 0, 255);

imagefill($img, 0, 0, $oBackground);
imagecolortransparent($img, $oBackground);

// Base
imagefilledarc($img,$centerx, $centery, $outerdia, $outerdia, 180, 0, $oGreen, IMG_ARC_EDGED);

// Warning
if($warn) {
	imagefilledarc($img, $centerx, $centery, $outerdia, $outerdia, $warnp, 0, $oYellow, IMG_ARC_EDGED);
}
// Critical
if($crit) {
	imagefilledarc($img,$centerx, $centery, $outerdia, $outerdia, $critp, 0, $oRed, IMG_ARC_EDGED);
}

// Borders
imagearc($img, $centerx, $centery+1, $outerdia+2, $outerdia+2, 180, 0, $oBlack);
imagefilledarc($img, $centerx, $centery, $outerdia/10, $outerdia/10,180, 0, $oBlue, IMG_ARC_EDGED);

//===================
// Create tacho line.
//===================

$diffy = sin (deg2rad(-$p+360))*(($outerdia+10)/2);
$diffx = cos (deg2rad(-$p+360))*(($outerdia+10)/2);
imagefilledarc($img, ($centerx-$diffx), ($centery+$diffy), ($outerdia+10), ($outerdia+10),($p-1),($p+1), $oBlue, IMG_ARC_EDGED);

//===================
// Labels
//===================

// Speedometer labels

imageline($img, ($centerx-$outerdia/2-5), ($centery+1), ($centerx+$outerdia/2+5), ($centery+1), $oBlack);
imagestring($img, 1, ($centerx-$outerdia/2-15), ($centery-6), 0, $oBlack);
imagestring($img, 1, ($centerx+$outerdia/2+8), ($centery-6), $max, $oBlack);

$count = 1;
$iOffsetX = -10;
for($degrees=45; $degrees<180; $degrees = $degrees+45) {
	$bediffy=sin (deg2rad(-$degrees+360))*(($outerdia+10)/2);
	$bediffx=cos (deg2rad(-$degrees+360))*(($outerdia+10)/2);
	$bediffy1=sin (deg2rad(-$degrees+360))*(($outerdia-10)/2);
	$bediffx1=cos (deg2rad(-$degrees+360))*(($outerdia-10)/2);
	
	imageline($img, ($centerx-$bediffx), ($centery+$bediffy),($centerx-$bediffx1), ($centery+$bediffy1), $oBlack);
	imagestring($img , 1 ,($centerx-$bediffx+$iOffsetX-8), ($centery+$bediffy-10) , ($max/4*$count) , $oBlack);
	
	$count = $count+1;
	$iOffsetX = $iOffsetX + 10;
}

//==============
// Output image.
//==============

if(function_exists('imageantialias')) {
	imageantialias($img, true);
}

imagepng($img);
imagedestroy($img);
?>
