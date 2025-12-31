-- Check if there's any customer service data with FRT
SELECT 
    COUNT(*) as total_tickets,
    COUNT(frt) as tickets_with_frt,
    COUNT(response_at) as tickets_with_response,
    MIN(created_at) as oldest_ticket,
    MAX(created_at) as newest_ticket
FROM customer_service_tickets;

-- Check FRT data by month
SELECT 
    DATE_FORMAT(created_at, '%b %Y') as month,
    DATE_FORMAT(created_at, '%Y-%m') as month_key,
    ROUND(AVG(frt), 1) as avg_frt,
    COUNT(*) as ticket_count
FROM customer_service_tickets
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    AND response_at IS NOT NULL
    AND frt IS NOT NULL
GROUP BY month_key, month
ORDER BY month_key ASC;
