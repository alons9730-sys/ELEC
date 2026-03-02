import React, { useEffect } from 'react';
import { useParams, Outlet } from 'react-router';
import { useSchedule } from '../store/ScheduleContext';

/**
 * URL 파라미터의 eventId를 ScheduleContext에 자동 설정하는 래퍼.
 * /events/:eventId/* 경로에서 사용됨.
 */
export const EventWrapper = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { setCurrentEventId } = useSchedule();

    useEffect(() => {
        if (eventId) setCurrentEventId(eventId);
        return () => setCurrentEventId(null);
    }, [eventId, setCurrentEventId]);

    return <Outlet />;
};
