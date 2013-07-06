<?php
/*****************************************************************************
 *
 * NagVisHost.php - Class of a Host in NagVis with all necessary information
 *                  which belong to the object handling in NagVis
 *
 * Copyright (c) 2004-2011 NagVis Project (Contact: info@nagvis.org)
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
 *****************************************************************************/

class NagVisHost extends NagVisStatefulObject {
    protected $type = 'host';

    protected static $langType = null;
    protected static $langSelf = null;
    protected static $langChild = null;
    protected static $langHostStateIs = null;
    protected static $langServices = null;

    protected $host_name;

    protected $members = array();

    public function __construct($backend_id, $hostName) {
        $this->backend_id = $backend_id;
        $this->host_name = $hostName;
        parent::__construct();
    }

    /**
     * PUBLIC fetchSummariesFromCounts()
     *
     * Fetches the summary state and output from the already set state counts
     *
     * @author  Lars Michelsen <lars@vertical-visions.de>
     */
    public function fetchSummariesFromCounts() {
        // Generate summary output
        // Only create summary output from members when the summary output is empty.
        // It might be generated by the backend.
        if($this->sum[OUTPUT] === null)
            $this->fetchSummaryOutputFromCounts();

        // Only create summary from members when the summary_state is empty.
        // It might be generated by the backend.
        if($this->sum[STATE] === null) {
            // Add host state to counts
            // This should be done after output generation and before
            // summary state fetching. It could confuse the output fetching but
            // is needed for the summary state
            $this->addHostStateToStateCounts();

            // Calculate summary state
            $this->fetchSummaryStateFromCounts();
        }
    }

    /**
     * PUBLIC queueState()
     *
     * Queues the state fetching to the backend.
     *
     * @param   Boolean  Optional flag to disable fetching of the object status
     * @param   Boolean  Optional flag to disable fetching of member status
     * @author  Lars Michelsen <lars@vertical-visions.de>
     */
    public function queueState($bFetchObjectState = true, $bFetchMemberState = true) {
        global $_BACKEND;
        $queries = Array();

        if($bFetchObjectState)
            $queries['hostState'] = true;

        if($this->recognize_services)
            $queries['hostMemberState'] = true;

        if($this->hover_menu == 1
           && $this->hover_childs_show == 1
           && $bFetchMemberState
           && !$this->hasMembers())
            $queries['hostMemberDetails'] = true;

        $_BACKEND->queue($queries, $this);
    }

    /**
     * PUBLIC applyState()
     *
     * Applies the fetched state
     *
     * @author  Lars Michelsen <lars@vertical-visions.de>
     */
    public function applyState() {
        if($this->problem_msg) {
            $this->sum[STATE]  = ERROR;
            $this->sum[OUTPUT] = $this->problem_msg;
            $this->members = Array();
            return;
        }

        if($this->hasMembers()) {
            foreach($this->getMembers() AS $MOBJ) {
                $MOBJ->applyState();
            }
        }

        // Use state summaries when some are available to
        // calculate summary state and output
        if($this->aStateCounts !== null) {
            $this->fetchSummariesFromCounts();
        } else {
            if($this->sum[STATE] === null)
                $this->fetchSummaryState();
            if($this->sum[OUTPUT] === null)
                $this->fetchSummaryOutput();
        }
    }

    # End public methods
    # #########################################################################

    /**
     * PRIVATE fetchSummaryState()
     *
     * Fetches the summary state from all services
     *
     * @author	Lars Michelsen <lars@vertical-visions.de>
     */
    private function fetchSummaryState() {
        // Get Host state
        $this->sum[STATE]    = $this->state[STATE];
        $this->sum[ACK]      = $this->state['problem_has_been_acknowledged'];
        $this->sum[DOWNTIME] = $this->state['in_downtime'];

        // Only merge host state with service state when recognize_services is set to 1
        if($this->recognize_services)
            $this->calcSummaryState();
    }

    /**
     * PUBLIC addHostStateToStateCounts()
     *
     * Adds the current host state to the member state counts
     *
     * @author	Lars Michelsen <lars@vertical-visions.de>
     */
    private function addHostStateToStateCounts() {
        $sState = $this->state[STATE];
        $sSubState = $this->getSubState();
        if(!isset($this->aStateCounts[$sState]))
            $this->aStateCounts[$sState] = Array($sSubState => 1);
        elseif(!isset($this->aStateCounts[$sState][$sSubState]))
            $this->aStateCounts[$sState][$sSubState] = 1;
        else
            $this->aStateCounts[$sState][$sSubState] += 1;
    }

    /**
     * PRIVATE fetchSummaryOutputFromCounts()
     *
     * Fetches the summary output from the object state counts
     *
     * @author	Lars Michelsen <lars@vertical-visions.de>
     */
    private function fetchSummaryOutputFromCounts() {
        if(NagVisHost::$langHostStateIs === null)
            NagVisHost::$langHostStateIs = l('hostStateIs');

        // Write host state
        $this->sum[OUTPUT] = NagVisHost::$langHostStateIs.' '.state_str($this->state[STATE]).'. ';

        // Only merge host state with service state when recognize_services is set
        // to 1
        if($this->recognize_services) {
            $iNumServices = 0;
            $arrServiceStates = Array();

            // Loop all major states
            if($this->aStateCounts !== null) {
                foreach($this->aStateCounts AS $sState => $aSubstates) {
                    // Ignore host state here
                    if(is_host_state($sState)) {
                        // Loop all substates (normal,ack,downtime,...)
                        foreach($aSubstates AS $sSubState => $iCount) {
                            // Found some objects with this state+substate
                            if($iCount > 0) {
                                if(!isset($arrServiceStates[$sState])) {
                                    $arrServiceStates[$sState] = $iCount;
                                    $iNumServices += $iCount;
                                } else {
                                    $arrServiceStates[$sState] += $iCount;
                                    $iNumServices += $iCount;
                                }
                            }
                        }
                    }
                }
            }

            if($iNumServices > 0) {
                if(NagVisHost::$langServices === null)
                    NagVisHost::$langServices = l('services');

                $this->mergeSummaryOutput($arrServiceStates, NagVisHost::$langServices);
            } else {
                $this->sum[OUTPUT] .= l('hostHasNoServices','HOST~'.$this->getName());
            }
        }
    }

    /**
     * PRIVATE fetchSummaryOutput()
     *
     * Fetches the summary output from host and all services
     *
     * @author	Lars Michelsen <lars@vertical-visions.de>
     */
    private function fetchSummaryOutput() {
        // Write host state
        $this->sum[OUTPUT] = l('hostStateIs').' '.state_str($this->state[STATE]).'. ';

        // Only merge host state with service state when recognize_services is set
        // to 1
        if($this->recognize_services) {
            // If there are services write the summary state for them
            if($this->hasMembers()) {
                $arrStates = Array(CRITICAL => 0, DOWN    => 0, WARNING   => 0,
                                   UNKNOWN  => 0, UP      => 0, OK        => 0,
                                   ERROR    => 0, PENDING => 0, UNCHECKED => 0);

                foreach($this->members AS &$SERVICE) {
                    $arrStates[$SERVICE->getSummaryState()]++;
                }

                $this->mergeSummaryOutput($arrStates, l('services'));
            } else {
                $this->sum[OUTPUT] .= l('hostHasNoServices','HOST~'.$this->getName());
            }
        }
    }
}
?>
