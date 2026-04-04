-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
