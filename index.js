import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Modal, Platform, ActivityIndicator, ColorPropType } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment/min/moment-with-locales';
import DateTimePicker from '@react-native-community/datetimepicker';
import { applyLocale, displayTitleByLocale } from './src/Locale';
import styles from './src/Style';
const monthArr=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
const WeeklyCalendar = props => {
    const [currDate, setCurrDate] = useState(moment(props.selected).locale(props.locale))
    const [weekdays, setWeekdays] = useState([])
    const [weekdayLabels, setWeekdayLabels] = useState([])
    const [selectedDate, setSelectedDate] = useState(currDate.clone())
    const [SelPos, setSelPos] = useState(0)
    const [isCalendarReady, setCalendarReady] = useState(false)
    const [pickerDate, setPickerDate] = useState(currDate.clone())
    const [isPickerVisible, setPickerVisible] = useState(false)
    const [cancelText, setCancelText] = useState('')
    const [confirmText, setConfirmText] = useState('')
    const [isLoading, setLoading] = useState(false)
    const [eventMap, setEventMap] = useState(undefined)
    const [scheduleView, setScheduleView] = useState(undefined)
    const [dayViewOffsets, setDayViewOffsets] = useState(undefined)
    const scrollViewRef = useRef()
    
    useEffect(() => { // only first mount
        applyLocale(props.locale, cancelText => setCancelText(cancelText), confirmText => setConfirmText(confirmText))
        createEventMap(props.events)
        setCalendarReady(true)
    }, [])

    const createEventMap = events => {
        let dateMap = new Map()
        for (let i = 0; i < events.length; i++) {
            let eventDate = moment(events[i].start).format('YYYY-MM-DD').toString()
            if (dateMap.has(eventDate)) {
                let eventArr = dateMap.get(eventDate)
                eventArr.push(events[i])
                dateMap.set(eventDate, eventArr) 
            } else {
                dateMap.set(eventDate, [events[i]])
            }
        }
        setEventMap(dateMap)
        createWeekdays(currDate, dateMap)
    }

    const createWeekdays = (date, map) => {

        
        let dayViews = []
        let offsets = []
        setWeekdays([])
        for (let i = 0; i < 7; i++) {
            const weekdayToAdd = date.clone().weekday(props.startWeekday - 7 + i)
            //alert(JSON.stringify(weekdayToAdd))
            setWeekdays(weekdays => [...weekdays, weekdayToAdd])
            setWeekdayLabels(weekdayLabels => [...weekdayLabels, weekdayToAdd.format(props.weekdayFormat)])

            // render schedule view
            let events = map.get(weekdayToAdd.format('YYYY-MM-DD').toString())
            
            let eventViews = []
            if (events !== undefined) {
                if(props.renderEvent !== undefined) {
                    eventViews = events.map((event, j) => {
                        if(props.renderFirstEvent !== undefined && j === 0) return props.renderFirstEvent(event, j)
                        else if(props.renderLastEvent !== undefined && j === events.length - 1) return props.renderLastEvent(event, j)
                        else return props.renderEvent(event, j)
                    })
                } else {
                    eventViews = events.map((event, j) => {
                        let startTime = moment(event.start).format('LT').toString()
                        let duration = event.duration.split(':')
                        let seconds = parseInt(duration[0]) * 3600 + parseInt(duration[1]) * 60 + parseInt(duration[2])
                        let endTime = moment(event.start).add(seconds, 'seconds').format('LT').toString()
                        return (
                            <View key={i + "-" + j}>
                                <View style={styles.event}>
                                    <View style={styles.eventDuration}>
                                        <View style={styles.durationContainer}>
                                            <View style={styles.durationDot} />
                                            <Text style={styles.durationText}>{startTime}</Text>
                                        </View>
                                        <View style={{ paddingTop: 10 }} />
                                        <View style={styles.durationContainer}>
                                            <View style={styles.durationDot} />
                                            <Text style={styles.durationText}>{endTime}</Text>
                                        </View>
                                        <View style={styles.durationDotConnector} />
                                    </View>
                                    <View style={styles.eventNote}>
                                        <Text style={styles.eventText}>{event.note}</Text>
                                    </View>
                                </View>
                                {j < events.length - 1 && <View style={styles.lineSeparator} />}
                            </View>
                        )
                    })
                }
            }

            let dayView = undefined
            if (props.renderDay !== undefined) {
                if (props.renderFirstDay !== undefined && i === 0) dayView = props.renderFirstDay(eventViews, weekdayToAdd, i)
                else if (props.renderLastDay !== undefined && i === 6) dayView = props.renderLastDay(eventViews, weekdayToAdd, i)
                else dayView = props.renderDay(eventViews, weekdayToAdd, i)
            } else {
                dayView = (
                    <View key={i.toString()} style={styles.day} onLayout= {event => { offsets[i] = event.nativeEvent.layout.y }}>
                        <View style={styles.dayLabel}>
                            <Text style={[styles.monthDateText, { color: props.themeColor }]}>{weekdayToAdd.format('M/D').toString()}</Text>
                            <Text style={[styles.dayText, { color: props.themeColor }]}>{weekdayToAdd.format(props.weekdayFormat).toString()}</Text>
                        </View>
                        <View style={[styles.allEvents, eventViews.length === 0 ? { width: '100%', backgroundColor: 'lightgrey' } : {}]}>
                            {eventViews}
                        </View>
                    </View>
                )
            }
            dayViews.push(dayView)
        }
        setScheduleView(dayViews)
        setDayViewOffsets(offsets)
    }

    // const clickLastWeekHandler = () => {
    //     setCalendarReady(false)
    //     const lastWeekCurrDate = currDate.subtract(7, 'days')
    //     setCurrDate(lastWeekCurrDate.clone())
    //     setSelectedDate(lastWeekCurrDate.clone().weekday(props.startWeekday - 7))
    //     createWeekdays(lastWeekCurrDate.clone(), eventMap)
    //     setCalendarReady(true)
    // }

    // const clickNextWeekHandler = () => {
    //     setCalendarReady(false)
    //     const nextWeekCurrDate = currDate.add(7, 'days')
    //     setCurrDate(nextWeekCurrDate.clone())
    //     setSelectedDate(nextWeekCurrDate.clone().weekday(props.startWeekday - 7))
    //     createWeekdays(nextWeekCurrDate.clone(), eventMap)
    //     setCalendarReady(true)
    // }

    const isSelectedDate = date => {
        //alert('hhh')
        return (selectedDate.year() === date.year() && selectedDate.month() === date.month() && selectedDate.date() === date.date())
    }

    const pickerOnChange = (_event, pickedDate) => {
        
        if (Platform.OS === 'android') {
            setPickerVisible(false)
            setLoading(true)
            if (pickedDate !== undefined) { // when confirm pressed
                setTimeout( () => {
                    let pickedDateMoment = moment(pickedDate).locale(props.locale)
                    setPickerDate(pickedDateMoment)
                    confirmPickerHandler(pickedDateMoment)
                    setLoading(false)
                }, 0)
            } else setLoading(false)
        }
        else setPickerDate(moment(pickedDate).locale(props.locale))
    }

    const confirmPickerHandler = pickedDate => {
        
        setCurrDate(pickedDate)
        setSelectedDate(pickedDate)

        setCalendarReady(false)
        createWeekdays(pickedDate, eventMap)
        setCalendarReady(true)

        setPickerVisible(false)
    }

    const onDayPress = (weekday, i) => {
        //alert('kk')
        scrollViewRef.current.scrollTo({ y: dayViewOffsets[i], animated: true })
        setSelectedDate(weekday.clone())
        setSelPos(i)
        if (props.onDayPress !== undefined) props.onDayPress(weekday.clone(), i)
    }

    return (
        <View style={[styles.component, props.style]}>
            {/* <View style={styles.header}>
                <TouchableOpacity style={styles.arrowButton} onPress={clickLastWeekHandler}>
                    <Text style={{ color: props.themeColor }}>{'\u25C0'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPickerVisible(true)}>
                    <Text style={[styles.title, props.titleStyle]}>{isCalendarReady && displayTitleByLocale(props.locale, selectedDate, props.titleFormat)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowButton} onPress={clickNextWeekHandler}>
                    <Text style={{ color: props.themeColor }}>{'\u25B6'}</Text>
                </TouchableOpacity>
            </View> */}
            <View style={styles.week}>
                <View style={styles.weekdayLabelContainer}>
                    <TouchableOpacity style={styles.weekdayLabel} onPress={onDayPress.bind(this, weekdays[0], 0)}>
                        <View style={{backgroundColor:isCalendarReady && isSelectedDate(weekdays[0]) ? '#FFF':props.themeColor,height:responsiveFontSize(4.5),width:responsiveFontSize(4.5),borderRadius:responsiveFontSize(3),justifyContent:'center',alignItems:'center'}}>
                        <Text style={isCalendarReady && isSelectedDate(weekdays[0]) ?styles.selectedHeader: [styles.weekdayLabelText, props.dayLabelStyle]}>{weekdays.length > 0 ? weekdayLabels[0].substr(0,1) : ''}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekdayLabel} onPress={onDayPress.bind(this, weekdays[1], 1)}>
                    <View style={{backgroundColor:isCalendarReady && isSelectedDate(weekdays[1]) ? '#FFF':props.themeColor,height:responsiveFontSize(4.5),width:responsiveFontSize(4.5),borderRadius:responsiveFontSize(3),justifyContent:'center',alignItems:'center'}}>
                        <Text style={isCalendarReady && isSelectedDate(weekdays[1]) ?styles.selectedHeader:[styles.weekdayLabelText, props.dayLabelStyle]}>{weekdays.length > 0 ? weekdayLabels[1].substr(0,1) : ''}</Text>
                    </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.weekdayLabel} onPress={onDayPress.bind(this, weekdays[2], 2)}>
                    <View style={{backgroundColor:isCalendarReady && isSelectedDate(weekdays[2]) ? '#FFF':props.themeColor,height:responsiveFontSize(4.5),width:responsiveFontSize(4.5),borderRadius:responsiveFontSize(3),justifyContent:'center',alignItems:'center'}}>
                        <Text style={isCalendarReady && isSelectedDate(weekdays[2]) ?styles.selectedHeader:[styles.weekdayLabelText, props.dayLabelStyle]}>{weekdays.length > 0 ? weekdayLabels[2].substr(0,1) : ''}</Text>
                    </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.weekdayLabel} onPress={onDayPress.bind(this, weekdays[3], 3)}>
                    <View style={{backgroundColor:isCalendarReady && isSelectedDate(weekdays[3]) ? '#FFF':props.themeColor,height:responsiveFontSize(4.5),width:responsiveFontSize(4.5),borderRadius:responsiveFontSize(3),justifyContent:'center',alignItems:'center'}}>
                        <Text style={isCalendarReady && isSelectedDate(weekdays[3]) ?styles.selectedHeader:[styles.weekdayLabelText, props.dayLabelStyle]}>{weekdays.length > 0 ? weekdayLabels[3].substr(0,1) : ''}</Text>
                    </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.weekdayLabel} onPress={onDayPress.bind(this, weekdays[4], 4)}>
                    <View style={{backgroundColor:isCalendarReady && isSelectedDate(weekdays[4]) ? '#FFF':props.themeColor,height:responsiveFontSize(4.5),width:responsiveFontSize(4.5),borderRadius:responsiveFontSize(3),justifyContent:'center',alignItems:'center'}}>
                        <Text style={isCalendarReady && isSelectedDate(weekdays[4]) ?styles.selectedHeader:[styles.weekdayLabelText, props.dayLabelStyle]}>{weekdays.length > 0 ? weekdayLabels[4].substr(0,1) : ''}</Text>
                    </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.weekdayLabel} onPress={onDayPress.bind(this, weekdays[5], 5)}>
                    <View style={{backgroundColor:isCalendarReady && isSelectedDate(weekdays[5]) ? '#FFF':props.themeColor,height:responsiveFontSize(4.5),width:responsiveFontSize(4.5),borderRadius:responsiveFontSize(3),justifyContent:'center',alignItems:'center'}}>
                        <Text style={isCalendarReady && isSelectedDate(weekdays[5]) ?styles.selectedHeader:[styles.weekdayLabelText, props.dayLabelStyle]}>{weekdays.length > 0 ? weekdayLabels[5].substr(0,1) : ''}</Text>
                    </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.weekdayLabel} onPress={onDayPress.bind(this, weekdays[6], 6)}>
                    <View style={{backgroundColor:isCalendarReady && isSelectedDate(weekdays[6]) ? '#FFF':props.themeColor,height:responsiveFontSize(4.5),width:responsiveFontSize(4.5),borderRadius:responsiveFontSize(3),justifyContent:'center',alignItems:'center'}}>
                        <Text style={isCalendarReady && isSelectedDate(weekdays[6]) ?styles.selectedHeader:[styles.weekdayLabelText, props.dayLabelStyle]}>{weekdays.length > 0 ? weekdayLabels[6].substr(0,1) : ''}</Text>
                    </View>
                    </TouchableOpacity>
                    
                </View>
                <View style={styles.weekdayNumberContainer}>
                    <TouchableOpacity style={styles.weekDayNumber} onPress={onDayPress.bind(this, weekdays[0], 0)}>
                        <View>
                            <Text style={{ color: "#FFF" ,fontSize:responsiveFontSize(1.9),fontWeight:isCalendarReady && isSelectedDate(weekdays[0]) ?'bold':'normal' }}>
                                {isCalendarReady && isSelectedDate(weekdays[0]) ? weekdays[0].date()+' '+monthArr[weekdays[0].month()]: isCalendarReady ? weekdays[0].date() :null}
                            </Text>
                        </View>
                        {isCalendarReady && isSelectedDate(weekdays[0])  ? <View style={{backgroundColor:'#FF739B',height:3,width:responsiveWidth(15),bottom:-5,position:'absolute'}} /> :null}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekDayNumber} onPress={onDayPress.bind(this, weekdays[1], 1)}>
                        <View>
                            <Text style={{ color: '#FFF' ,fontSize:responsiveFontSize(1.9),fontWeight:isCalendarReady && isSelectedDate(weekdays[1]) ?'bold':'normal'}}>
                            {isCalendarReady && isSelectedDate(weekdays[1]) ? weekdays[1].date()+' '+monthArr[weekdays[1].month()]: isCalendarReady? weekdays[1].date():null}
                            </Text>
                        </View>
                        {isCalendarReady && isSelectedDate(weekdays[1])  ? <View style={{backgroundColor:'#FF739B',height:3,width:responsiveWidth(15),bottom:-5,position:'absolute'}} /> :null}
                        
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekDayNumber} onPress={onDayPress.bind(this, weekdays[2], 2)}>
                        <View >
                            <Text style={{ color: '#FFF',fontSize:responsiveFontSize(1.9),fontWeight:isCalendarReady && isSelectedDate(weekdays[2]) ?'bold':'normal' }}>
                            {isCalendarReady && isSelectedDate(weekdays[2]) ? weekdays[2].date()+' '+monthArr[weekdays[2].month()]: isCalendarReady ? weekdays[2].date():null}
                            </Text>
                        </View>
                        {isCalendarReady && isSelectedDate(weekdays[2]) ? <View style={{backgroundColor:'#FF739B',height:3,width:responsiveWidth(15),bottom:-5,position:'absolute'}} /> :null}
                        
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekDayNumber} onPress={onDayPress.bind(this, weekdays[3], 3)}>
                        <View>
                            <Text style={{ color: '#FFF',fontSize:responsiveFontSize(1.9),fontWeight:isCalendarReady && isSelectedDate(weekdays[3]) ?'bold':'normal' }}>
                            {isCalendarReady && isSelectedDate(weekdays[3]) ? weekdays[3].date()+' '+monthArr[weekdays[3].month()]: isCalendarReady ? weekdays[3].date():null}
                            </Text>
                        </View>
                        {isCalendarReady && isSelectedDate(weekdays[3]) ? <View style={{backgroundColor:'#FF739B',height:3,width:responsiveWidth(15),bottom:-5,position:'absolute'}} /> :null}
                        
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekDayNumber} onPress={onDayPress.bind(this, weekdays[4], 4)}>
                        <View>
                            <Text style={{ color: '#FFF',fontSize:responsiveFontSize(1.9),fontWeight:isCalendarReady && isSelectedDate(weekdays[4]) ?'bold':'normal' }}>
                            {isCalendarReady && isSelectedDate(weekdays[4]) ? weekdays[4].date()+' '+monthArr[weekdays[4].month()]: isCalendarReady ? weekdays[4].date():null}
                            </Text>
                        </View>
                        {isCalendarReady && isSelectedDate(weekdays[4]) ? <View style={{backgroundColor:'#FF739B',height:3,width:responsiveWidth(15),bottom:-5,position:'absolute'}} /> :null}
                        
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekDayNumber} onPress={onDayPress.bind(this, weekdays[5], 5)}>
                        <View>
                            <Text style={{ color: '#FFF',fontSize:responsiveFontSize(1.9),fontWeight:isCalendarReady && isSelectedDate(weekdays[5]) ?'bold':'normal' }}>
                            {isCalendarReady && isSelectedDate(weekdays[5]) ? weekdays[5].date()+' '+monthArr[weekdays[5].month()]: isCalendarReady ? weekdays[5].date():null}
                            </Text>
                        </View>
                        {isCalendarReady && isSelectedDate(weekdays[5]) ? <View style={{backgroundColor:'#FF739B',height:3,width:responsiveWidth(15),bottom:-5,position:'absolute'}} /> :null}
                        
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.weekDayNumber} onPress={onDayPress.bind(this, weekdays[6], 6)}>
                        <View>
                            <Text style={{ color: '#FFF',fontSize:responsiveFontSize(1.9),fontWeight:isCalendarReady && isSelectedDate(weekdays[6]) ?'bold':'normal' }}>
                            {isCalendarReady && isSelectedDate(weekdays[6]) ? weekdays[6].date()+' '+monthArr[weekdays[6].month()]: isCalendarReady ? weekdays[6].date():null}
                            </Text>
                        </View>
                        {isCalendarReady && isSelectedDate(weekdays[6]) ? <View style={{backgroundColor:'#FF739B',height:3,width:responsiveWidth(15),bottom:-5,position:'absolute'}} /> :null}
                        
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView ref={scrollViewRef} style={styles.schedule}>
                {(scheduleView !== undefined) && scheduleView}
            </ScrollView>
            {Platform.OS === 'ios' && <Modal
                transparent={true}
                animationType='fade'
                visible={isPickerVisible}
                onRequestClose={() => setPickerVisible(false)} // for android only
                style={styles.modal}
            >
                <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
                    <View style={styles.blurredArea} />
                </TouchableWithoutFeedback>
                <View style={styles.pickerButtons}>
                    <TouchableOpacity style={styles.modalButton} onPress={() => setPickerVisible(false)}>
                        <Text style={styles.modalButtonText}>{cancelText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalButton} onPress={confirmPickerHandler.bind(this, pickerDate)}>
                        <Text style={styles.modalButtonText}>{confirmText}</Text>
                    </TouchableOpacity>
                </View>
                <DateTimePicker
                    locale={props.locale}
                    value={pickerDate.toDate()}
                    onChange={pickerOnChange}
                    style={styles.picker}
                />
            </Modal> }
            {Platform.OS === 'android' && isPickerVisible && <DateTimePicker
                locale={props.locale}
                value={pickerDate.toDate()}
                display='spinner'
                onChange={pickerOnChange}
            /> }
            {(!isCalendarReady || isLoading) && <ActivityIndicator size='large' color='grey' style={styles.indicator} />}
        </View>
    )

};

WeeklyCalendar.propTypes = {
    /** initially selected day */
    selected: PropTypes.any,
    /** If firstDay = 1, week starts from Monday. If firstDay = 7, week starts from Sunday. */
    startWeekday: PropTypes.number,
    /** Set format to display title (e.g. titleFormat='MMM YYYY' displays "Jan 2020") */
    titleFormat: PropTypes.string,
    /** Set format to display weekdays (e.g. weekdayFormat='dd' displays "Mo" and weekdayFormat='ddd' displays "Mon") */
    weekdayFormat: PropTypes.string,
    /** Set locale (e.g. Korean='ko', English='en', Chinese(Mandarin)='zh-cn', etc.) */
    locale: PropTypes.string,
    /** Set list of events you want to display below weekly calendar. 
     * Default is empty array []. */
    events: PropTypes.array,
    /** Specify how each event should be rendered below weekly calendar. Event & index are given as parameters. */
    renderEvent: PropTypes.func,
    /** Specify how first event should be rendered below weekly calendar. Event & index are given as parameters. */
    renderFirstEvent: PropTypes.func,
    /** Specify how last event should be rendered below weekly calendar. Event & index are given as parameters. */
    renderLastEvent: PropTypes.func,
    /** Specify how day should be rendered below weekly calendar. Event Views, day (Moment object), index are given as parameters. */
    renderDay: PropTypes.func,
    /** Specify how first day should be rendered below weekly calendar. Event Views, day (Moment object), index are given as parameters. */
    renderFirstDay: PropTypes.func,
    /** Specify how last day should be rendered below weekly calendar. Event Views, day (Moment object), index are given as parameters. */
    renderLastDay: PropTypes.func,
    /** Handler which gets executed on day press. Default = undefined */
    onDayPress: PropTypes.func,
    /** Set theme color */
    themeColor: PropTypes.string,
    /** Set style of component */
    style: PropTypes.any,
    /** Set text style of calendar title */
    titleStyle: PropTypes.any,
    /** Set text style of weekday labels */
    dayLabelStyle: PropTypes.any
};

WeeklyCalendar.defaultProps = { // All props are optional
    selected: moment(),
    startWeekday: 7,
    titleFormat: undefined,
    weekdayFormat: 'ddd',
    locale: 'en',
    events: [],
    renderEvent: undefined,
    renderFirstEvent: undefined,
    renderLastEvent: undefined,
    renderDay: undefined,
    renderFirstDay: undefined,
    renderLastDay: undefined,
    onDayPress: undefined,
    themeColor: '#46c3ad',
    style: {},
    titleStyle: {},
    dayLabelStyle: {},
};

export default WeeklyCalendar;
