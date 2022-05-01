import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial } from "typeorm";
import { BusinessData } from "../entities/businessData.entity";
import BusinessDataCustomRepository from "../repositories/businessData.custom.repository";
import HomeService from "./home.service";

@Injectable()
export default class BusinessDataService {
  constructor(
    @InjectRepository(BusinessDataCustomRepository)
    private readonly businessDataRepository: BusinessDataCustomRepository,
    private readonly homeService: HomeService
  ) {}
  
  // QUESTION 1.
  // First part : the computation of the negociation margin function
  async computeNegociationMargin(
        finalOfferPrice: number,
        targetSalePrice: number,
        maxNegociationMargin: number
    ): Promise<number> {
        return Math.min(targetSalePrice / finalOfferPrice - 1, maxNegociationMargin)
    }
  // Second part : the computation of the service fees of an offer
  async computeServiceFees(finalOfferPrice: number, zipCode: number): Promise<number> {
        let dept = Math.round(zipCode * 0.001)          // Obtain department code from the zip code
        if (finalOfferPrice < 100 000) {                // Strip 1 : under 100k
            if (dept === 59) { return 15 000 }
            elif(dept === 44 || dept === 69){ return 20 000 }
            elif(dept in [75, 92, 93, 94]){ return 20 000 }
        }
        elif(finalOfferPrice < 145 000 && finalOfferPrice >= 100 000){      // Strip 2 : over 100k but under 145k
            if (dept === 59) { return 19 000 }
            elif(dept === 44 || dept === 69){ return 22 000 }
            elif(dept in [75, 92, 93, 94]){ return 22 000 }
        }
        elif(finalOfferPrice < 200 000 && finalOfferPrice >= 145 000){      // Strip 3 : over 145k but under 200k
            if (dept === 59) { return 20 000 }
            elif(dept === 44 || dept === 69){ return 23 000 }
            elif(dept in [75, 92, 93, 94]){ return 23 000 }
        }
        elif(finalOfferPrice < 400 000 && finalOfferPrice >= 200 000){      // Strip 4 : over 200k but under 400k
            if (dept === 59) { return 0.1 * finalOfferPrice }
            elif(dept === 44 || dept === 69){ return 0.11 * finalOfferPrice }
            elif(dept in [75, 92, 93, 94]){ return 0.11 * finalOfferPrice }
        }
        elif(finalOfferPrice < 650 000 && finalOfferPrice >= 400 000){      // Strip 5 : over 400k but under 650k
            if (dept === 59) { return 0.08 * finalOfferPrice }
            elif(dept === 44 || dept === 69){ return 0.08 * finalOfferPrice }
            elif(dept in [75, 92, 93, 94]){ return 0.08 * finalOfferPrice }
        }
   else {                                                                   // Strip 6 : over 650k
            if (dept === 59) { return 0.3 * finalOfferPrice }
            elif(dept === 44 || dept === 69){ return 0.999999 * finalOfferPrice }       // Is this rate actual ? To ask the interviewers
            elif(dept in [75, 92, 93, 94]){ return 0.1 * finalOfferPrice }
        }
    }

  async generateBusinessDataForHome(
    homeUuid: string,
    initialOfferPrice: number,
    finalOfferPrice: number,
    targetSalePrice: number
  ): Promise<BusinessData> {
    // TODO : write business data logic to compute :
    //  - serviceFees (see README)
    //  - negociation margin (see README)

    const businessData = await this.createBusinessData({
      homeUuid,
      initialOfferPrice,
      finalOfferPrice,
      targetSalePrice,
      // serviceFees
      // negociationMargin
    });
    await this.homeService.updateHome(homeUuid, {
      businessDataUuid: businessData.uuid,
    });
    return businessData;
  }

  async findBusinessDataByHomeUuid(homeUuid: string): Promise<BusinessData> {
    const results = await this.businessDataRepository.find({ homeUuid });
    if (results.length !== 1) {
      throw Error(
        `Could not find business data from home with uuid ${homeUuid}`
      );
    }
    return results[0];
  }

  async findBusinessData(uuid: string): Promise<BusinessData> {
    const results = await this.businessDataRepository.findByIds([uuid]);
    if (results.length !== 1) {
      throw Error(`Could not find business data with uuid ${uuid}`);
    }
    return results[0];
  }

  async createBusinessData(
    inputBusinessData: DeepPartial<BusinessData>
  ): Promise<BusinessData> {
    const businessData = await this.businessDataRepository.create(
      inputBusinessData
    );
    return this.businessDataRepository.save(businessData);
  }

  async deleteBusinessData(uuid: string): Promise<number> {
    const result = await this.businessDataRepository.delete({ uuid: uuid });
    if (!result.affected) {
      throw Error(`Could not delete business data with uuid ${uuid}`);
    }
    return result.affected;
  }
}
