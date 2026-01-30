'use client';

import { CounsellorProvider, FloatingCounsellor } from '@/components/floating-counsellor';

export function FloatingCounsellorWrapper() {
    return (
        <CounsellorProvider>
            <FloatingCounsellor />
        </CounsellorProvider>
    );
}

export default FloatingCounsellorWrapper;
